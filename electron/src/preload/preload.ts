import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Config
  loadConfig: () => ipcRenderer.invoke("config:load"),
  saveConfig: (config: any) => ipcRenderer.invoke("config:save", config),

  // Video validation
  validateVideo: (filePath: string) =>
    ipcRenderer.invoke("video:validate", filePath),
  getOutputPath: (inputPath: string) =>
    ipcRenderer.invoke("video:getOutputPath", inputPath),

  // FFmpeg processing
  ffmpegPass1: (args: any) => ipcRenderer.invoke("ffmpeg:pass1", args),
  ffmpegPass2: (args: any) => ipcRenderer.invoke("ffmpeg:pass2", args),

  // Process count for close confirmation
  setProcessCount: (count: number) => ipcRenderer.send("process:count", count),
});

// Type definition for window.electronAPI
declare global {
  interface Window {
    electronAPI: {
      loadConfig: () => Promise<any>;
      saveConfig: (
        config: any,
      ) => Promise<{ success: boolean; error?: string }>;
      validateVideo: (filePath: string) => Promise<{
        success: boolean;
        duration?: number;
        fileSize?: number;
        error?: string;
      }>;
      getOutputPath: (inputPath: string) => Promise<string>;
      ffmpegPass1: (
        args: any,
      ) => Promise<{
        success: boolean;
        output?: string;
        error?: string;
        stderr?: string;
      }>;
      ffmpegPass2: (
        args: any,
      ) => Promise<{
        success: boolean;
        output?: string;
        error?: string;
        stderr?: string;
      }>;
      setProcessCount: (count: number) => void;
    };
  }
}
