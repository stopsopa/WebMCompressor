import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import { extractMetadata } from "../tools/extractMetadata.js";
import driveCompression from "../tools/driveCompression.js";
import { generateFFMPEGParamsStrings } from "../tools/generateFFMPEGParams.js";
import scaleWandH from "../tools/scaleWandH.js";
import { getFFmpegPath, getFFprobePath, getVersions } from "./bins.js";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

// Use app.getPath('userData') for app configuration - standard Electron practice
const getConfigDir = () => path.join(app.getPath("userData"), "config");
const getConfigPath = () => path.join(getConfigDir(), "config.json");

// Track active processes for close confirmation
let activeProcessCount = 0;

async function createWindow() {
  const isDev = !!process.env.VITE_DEV_SERVER_URL;

  mainWindow = new BrowserWindow({
    width: isDev ? 1700 : 1100,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      // Enable file path access for drag-and-drop
      webSecurity: false,
    },
    title: "WebM Compressor",
  });

  // Load Vite dev server in development or built files in production
  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL!);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../../dist/index.html"));
  }

  // Handle window close with confirmation if processing
  mainWindow.on("close", async (e) => {
    if (activeProcessCount > 0) {
      e.preventDefault();

      const response = await dialog.showMessageBox(mainWindow!, {
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
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      console.error("error loading config:", error.message || error);
    }
    // Return default config if file doesn't exist or is invalid
    return {
      scale: false,
      videoWidth: null,
      videoHeight: null,
      parallelProcessing: 1,
    };
  }
});

// Save configuration
ipcMain.handle("config:save", async (_event, config) => {
  try {
    // Strictly filter allowed fields
    const filteredConfig = {
      scale: !!config.scale,
      videoWidth: typeof config.videoWidth === "number" ? config.videoWidth : null,
      videoHeight: typeof config.videoHeight === "number" ? config.videoHeight : null,
      parallelProcessing: typeof config.parallelProcessing === "number" ? config.parallelProcessing : 1,
    };

    await fs.mkdir(getConfigDir(), { recursive: true });
    await fs.writeFile(getConfigPath(), JSON.stringify(filteredConfig, null, 2));
    return { success: true };
  } catch (error) {
    console.error("Failed to save config:", error);
    return { success: false, error: String(error) };
  }
});

// Validate video file and get metadata using FFprobe
ipcMain.handle("video:validate", async (_event, filePath: string) => {
  try {
    const meta = await extractMetadata(getFFprobePath(), filePath);

    return {
      success: true,
      ...meta,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to validate video file",
    };
  }
});

// Get tool versions (Phase 4)
ipcMain.handle("app:getVersions", async () => {
  return await getVersions();
});

// Generate output path with collision handling
ipcMain.handle("video:getOutputPath", async (_event, inputPath: string) => {
  const dir = path.dirname(inputPath);
  const ext = path.extname(inputPath);
  const basename = path.basename(inputPath, ext);

  let outputPath: string;

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
      } catch {
        // File doesn't exist, we can use this path
        break;
      }
    } while (true);
  } else {
    // Different format, just change extension to .webm
    outputPath = path.join(dir, `${basename}.webm`);
  }

  return outputPath;
});

// Update active process count
ipcMain.on("process:count", (_event, count: number) => {
  activeProcessCount = count;
});

// Start Compression (Phase 4)
ipcMain.on("compression:start", async (event, args: { id: string; sourceFile: string; settings: any }) => {
  const { id, sourceFile, settings } = args;

  try {
    await driveCompression({
      sourceFile,
      ffmpegPath: getFFmpegPath(),
      ffprobePath: getFFprobePath(),
      scale: !!settings.scale,
      videoWidth: settings.videoWidth,
      videoHeight: settings.videoHeight,
      progressEvent: (error, progress) => {
        if (mainWindow) {
          mainWindow.webContents.send("compression:progress", { id, progress });
        }
      },
      end: (step, error, duration) => {
        if (mainWindow) {
          mainWindow.webContents.send("compression:end", { id, step, error, duration });
        }
      },
    });
  } catch (error: any) {
    if (mainWindow) {
      mainWindow.webContents.send("compression:end", {
        id,
        step: "error",
        error: error.message || String(error),
        duration: "0s",
      });
    }
  }
});

// Reveal file in Finder/Explorer
ipcMain.on("video:reveal", (_event, filePath: string) => {
  shell.showItemInFolder(filePath);
});

// Get full FFMPEG command (Phase 4)
ipcMain.handle("video:getCommand", async (_event, args: { sourceFile: string; settings: any; metadata: any }) => {
  const { sourceFile, settings, metadata } = args;
  const ffmpeg = getFFmpegPath();

  let { videoWidth, videoHeight } = settings;

  if (settings.scale) {
    const scaled = scaleWandH({ height: metadata.height, width: metadata.width }, {
      height: videoHeight,
      width: videoWidth,
    } as any);
    videoHeight = scaled.height;
    videoWidth = scaled.width;
  }

  const result = generateFFMPEGParamsStrings({
    sourceFile,
    scale: !!settings.scale,
    videoWidth,
    videoHeight,
    frameRate: metadata.fps,
  });

  return `\n\n"${ffmpeg}" ${result.firstPass}\n\n"${ffmpeg}" ${result.secondPass}\n\n`;
});

// Open external URL (Phase 4)
ipcMain.on("app:openExternal", (_event, url: string) => {
  shell.openExternal(url);
});
