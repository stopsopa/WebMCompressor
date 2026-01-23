"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    // Config
    loadConfig: () => electron_1.ipcRenderer.invoke("config:load"),
    saveConfig: (config) => electron_1.ipcRenderer.invoke("config:save", config),
    // Video validation
    validateVideo: (filePath) => electron_1.ipcRenderer.invoke("video:validate", filePath),
    getOutputPath: (inputPath) => electron_1.ipcRenderer.invoke("video:getOutputPath", inputPath),
    // FFmpeg processing
    ffmpegPass1: (args) => electron_1.ipcRenderer.invoke("ffmpeg:pass1", args),
    ffmpegPass2: (args) => electron_1.ipcRenderer.invoke("ffmpeg:pass2", args),
    // Process count for close confirmation
    setProcessCount: (count) => electron_1.ipcRenderer.send("process:count", count),
    // Tool to get file path from File object (standard in modern Electron)
    getPathForFile: (file) => electron_1.webUtils.getPathForFile(file),
});
