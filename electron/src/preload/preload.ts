import { contextBridge, ipcRenderer, webUtils } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Config
  loadConfig: () => ipcRenderer.invoke("config:load"),
  saveConfig: (config: any) => ipcRenderer.invoke("config:save", config),

  // Video validation
  validateVideo: (filePath: string) => ipcRenderer.invoke("video:validate", filePath),
  getOutputPath: (inputPath: string) => ipcRenderer.invoke("video:getOutputPath", inputPath),

  // FFmpeg processing
  ffmpegPass1: (args: any) => ipcRenderer.invoke("ffmpeg:pass1", args),
  ffmpegPass2: (args: any) => ipcRenderer.invoke("ffmpeg:pass2", args),

  // Process count for close confirmation
  setProcessCount: (count: number) => ipcRenderer.send("process:count", count),

  // Tool to get file path from File object (standard in modern Electron)
  getPathForFile: (file: File) => webUtils.getPathForFile(file),

  // Reveal file in Finder/Explorer
  revealVideo: (filePath: string) => ipcRenderer.send("video:reveal", filePath),
});

// Type definition for window.electronAPI
declare global {
  interface Window {
    electronAPI: {
      loadConfig: () => Promise<any>;
      saveConfig: (config: any) => Promise<{ success: boolean; error?: string }>;
      validateVideo: (filePath: string) => Promise<{
        success: boolean;
        width?: number;
        height?: number;
        fps?: number;
        durationMs?: number;
        error?: string;
      }>;
      getOutputPath: (inputPath: string) => Promise<string>;
      ffmpegPass1: (args: any) => Promise<{
        success: boolean;
        output?: string;
        error?: string;
        stderr?: string;
      }>;
      ffmpegPass2: (args: any) => Promise<{
        success: boolean;
        output?: string;
        error?: string;
        stderr?: string;
      }>;
      setProcessCount: (count: number) => void;
      getPathForFile: (file: File) => string;
      revealVideo: (filePath: string) => void;
    };
  }
}
