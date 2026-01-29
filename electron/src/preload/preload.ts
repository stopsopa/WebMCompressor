import { contextBridge, ipcRenderer, webUtils } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // Config
  loadConfig: () => ipcRenderer.invoke("config:load"),
  saveConfig: (config: any) => ipcRenderer.invoke("config:save", config),

  // Video validation
  validateVideo: (filePath: string, settings: any) => ipcRenderer.invoke("video:validate", filePath, settings),
  getOutputPath: (inputPath: string) => ipcRenderer.invoke("video:getOutputPath", inputPath),

  // New Compression IPC (Phase 4)
  startCompression: (args: {
    id: string;
    sourceFile: string;
    settings: any;
    metadata: { width: number; height: number; fps: number };
  }) => ipcRenderer.send("compression:start", args),
  onCompressionProgress: (callback: (id: string, progress: any) => void) => {
    const listener = (_event: any, data: { id: string; progress: any }) => callback(data.id, data.progress);
    ipcRenderer.on("compression:progress", listener);
    return () => ipcRenderer.removeListener("compression:progress", listener);
  },
  onCompressionEnd: (callback: (id: string, step: string, error: string | null, duration: string) => void) => {
    const listener = (_event: any, data: { id: string; step: string; error: string | null; duration: string }) =>
      callback(data.id, data.step, data.error, data.duration);
    ipcRenderer.on("compression:end", listener);
    return () => ipcRenderer.removeListener("compression:end", listener);
  },

  // Process count for close confirmation
  setProcessCount: (count: number) => ipcRenderer.send("process:count", count),

  // Tool to get file path from File object (standard in modern Electron)
  getPathForFile: (file: File) => webUtils.getPathForFile(file),

  // Reveal file in Finder/Explorer
  revealVideo: (filePath: string) => ipcRenderer.send("video:reveal", filePath),

  // Get full ffmpeg command for clipboard (Phase 4)
  getFFMPEGCommand: (args: { sourceFile: string; settings: any; metadata: any }) =>
    ipcRenderer.invoke("video:getCommand", args),

  // Get tool versions (Phase 4)
  getAppVersions: () => ipcRenderer.invoke("app:getVersions"),

  // Open URL in system browser
  openExternal: (url: string) => ipcRenderer.send("app:openExternal", url),
});

// Type definition for window.electronAPI
declare global {
  interface Window {
    electronAPI: {
      loadConfig: () => Promise<any>;
      saveConfig: (config: any) => Promise<{ success: boolean; error?: string }>;
      validateVideo: (
        filePath: string,
        settings: any,
      ) => Promise<{
        success: boolean;
        width?: number;
        height?: number;
        fps?: number;
        durationMs?: number;
        size?: number;
        outputPath?: string;
        error?: string;
      }>;
      getOutputPath: (inputPath: string) => Promise<string>;
      startCompression: (args: {
        id: string;
        sourceFile: string;
        settings: any;
        metadata: { width: number; height: number; fps: number };
      }) => void;
      onCompressionProgress: (callback: (id: string, progress: any) => void) => () => void;
      onCompressionEnd: (
        callback: (id: string, step: string, error: string | null, duration: string) => void,
      ) => () => void;
      setProcessCount: (count: number) => void;
      getPathForFile: (file: File) => string;
      revealVideo: (filePath: string) => void;
      getFFMPEGCommand: (args: { sourceFile: string; settings: any; metadata: any }) => Promise<string>;
      getAppVersions: () => Promise<{ ffmpeg: string; ffprobe: string }>;
      openExternal: (url: string) => void;
    };
  }
}
