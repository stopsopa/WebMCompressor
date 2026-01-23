import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let mainWindow = null;
// Use app.getPath('home') instead of os.homedir() - more reliable in Electron
const getConfigDir = () => path.join(app.getPath("home"), "WebMCompressor");
const getConfigPath = () => path.join(getConfigDir(), "config.json");
// Track active processes for close confirmation
let activeProcessCount = 0;
async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, "../preload/preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
        title: "WebM Compressor",
    });
    // Load Vite dev server in development or built files in production
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path.join(__dirname, "../../dist/index.html"));
    }
    // Handle window close with confirmation if processing
    mainWindow.on("close", async (e) => {
        if (activeProcessCount > 0) {
            e.preventDefault();
            const response = await dialog.showMessageBox(mainWindow, {
                type: "warning",
                buttons: ["Cancel", "Quit"],
                defaultId: 0,
                title: "Processing in progress",
                message: "Are you sure you want to quit?",
                detail: `${activeProcessCount} file(s) are currently being processed. Incomplete conversions will be lost.`,
            });
            if (response.response === 1) {
                // User chose to quit
                app.exit(0);
            }
        }
    });
}
app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
// IPC Handlers
// Load configuration
ipcMain.handle("config:load", async () => {
    try {
        await fs.mkdir(getConfigDir(), { recursive: true });
        const data = await fs.readFile(getConfigPath(), "utf-8");
        return JSON.parse(data);
    }
    catch (error) {
        // Return default config if file doesn't exist
        return {
            defaultQuality: "medium",
            defaultResolution: "original",
            maxWidth: null,
            maxHeight: null,
            sizePerSecond: null,
            parallelProcessing: 1,
            overwriteExisting: false,
        };
    }
});
// Save configuration
ipcMain.handle("config:save", async (_event, config) => {
    try {
        await fs.mkdir(getConfigDir(), { recursive: true });
        await fs.writeFile(getConfigPath(), JSON.stringify(config, null, 2));
        return { success: true };
    }
    catch (error) {
        console.error("Failed to save config:", error);
        return { success: false, error: String(error) };
    }
});
// Validate video file and get metadata using FFprobe
ipcMain.handle("video:validate", async (_event, filePath) => {
    try {
        const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration,size -of json "${filePath}"`);
        const data = JSON.parse(stdout);
        if (!data.format || !data.format.duration) {
            throw new Error("Not a valid video file or duration could not be determined");
        }
        return {
            success: true,
            duration: parseFloat(data.format.duration),
            fileSize: parseInt(data.format.size || "0", 10),
        };
    }
    catch (error) {
        return {
            success: false,
            error: error.message || "Failed to validate video file",
        };
    }
});
// Generate output path with collision handling
ipcMain.handle("video:getOutputPath", async (_event, inputPath) => {
    const dir = path.dirname(inputPath);
    const ext = path.extname(inputPath);
    const basename = path.basename(inputPath, ext);
    let outputPath;
    if (ext.toLowerCase() === ".webm") {
        // Input is already webm, add [compressed] suffix
        let suffix = "[compressed]";
        let counter = 0;
        do {
            outputPath = path.join(dir, `${basename}${suffix}.webm`);
            try {
                await fs.access(outputPath);
                // File exists, add another [compressed]
                suffix += "[compressed]";
                counter++;
                if (counter > 100) {
                    throw new Error("Too many compressed versions exist");
                }
            }
            catch {
                // File doesn't exist, we can use this path
                break;
            }
        } while (true);
    }
    else {
        // Different format, just change extension to .webm
        outputPath = path.join(dir, `${basename}.webm`);
    }
    return outputPath;
});
// Update active process count
ipcMain.on("process:count", (_event, count) => {
    activeProcessCount = count;
});
// Start FFmpeg process (pass 1)
ipcMain.handle("ffmpeg:pass1", async (_event, args) => {
    const { inputPath, settings } = args;
    // Build FFmpeg command for pass 1
    const bitrate = settings.calculatedBitrate || settings.bitrate;
    const minBitrate = Math.floor(bitrate * 0.5);
    const maxBitrate = Math.floor(bitrate * 1.45);
    let scaleFilter = "";
    if (settings.resolution === "maxWidth" && settings.maxWidth) {
        scaleFilter = `-vf scale='min(iw,${settings.maxWidth}):-2'`;
    }
    else if (settings.resolution === "maxHeight" && settings.maxHeight) {
        scaleFilter = `-vf scale='-2:min(ih,${settings.maxHeight})'`;
    }
    const command = `ffmpeg -i "${inputPath}" ${scaleFilter} -c:v libvpx-vp9 -b:v ${bitrate}k -minrate ${minBitrate}k -maxrate ${maxBitrate}k -tile-columns 4 -g 240 -threads 4 -quality good -speed 4 -crf ${settings.crf} -pass 1 -an -f null ${process.platform === "win32" ? "NUL" : "/dev/null"}`;
    try {
        const { stdout, stderr } = await execAsync(command);
        return { success: true, output: stderr };
    }
    catch (error) {
        return { success: false, error: error.message, stderr: error.stderr };
    }
});
// Start FFmpeg process (pass 2)
ipcMain.handle("ffmpeg:pass2", async (_event, args) => {
    const { inputPath, outputPath, settings } = args;
    const bitrate = settings.calculatedBitrate || settings.bitrate;
    const minBitrate = Math.floor(bitrate * 0.5);
    const maxBitrate = Math.floor(bitrate * 1.45);
    let scaleFilter = "";
    if (settings.resolution === "maxWidth" && settings.maxWidth) {
        scaleFilter = `-vf scale='min(iw,${settings.maxWidth}):-2'`;
    }
    else if (settings.resolution === "maxHeight" && settings.maxHeight) {
        scaleFilter = `-vf scale='-2:min(ih,${settings.maxHeight})'`;
    }
    const command = `ffmpeg -i "${inputPath}" ${scaleFilter} -c:v libvpx-vp9 -b:v ${bitrate}k -minrate ${minBitrate}k -maxrate ${maxBitrate}k -tile-columns 4 -g 240 -threads 4 -quality good -speed 2 -crf ${settings.crf} -pass 2 -c:a libopus -b:a 128k -progress pipe:1 -y "${outputPath}"`;
    try {
        const { stdout, stderr } = await execAsync(command);
        return { success: true, output: stderr };
    }
    catch (error) {
        return { success: false, error: error.message, stderr: error.stderr };
    }
});
