import { contextBridge, ipcRenderer } from "electron";
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
    // Config
    loadConfig: () => ipcRenderer.invoke("config:load"),
    saveConfig: (config) => ipcRenderer.invoke("config:save", config),
    // Video validation
    validateVideo: (filePath) => ipcRenderer.invoke("video:validate", filePath),
    getOutputPath: (inputPath) => ipcRenderer.invoke("video:getOutputPath", inputPath),
    // FFmpeg processing
    ffmpegPass1: (args) => ipcRenderer.invoke("ffmpeg:pass1", args),
    ffmpegPass2: (args) => ipcRenderer.invoke("ffmpeg:pass2", args),
    // Process count for close confirmation
    setProcessCount: (count) => ipcRenderer.send("process:count", count),
});
