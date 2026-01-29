/// <reference types="vite/client" />

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

  namespace JSX {
    interface IntrinsicElements {
      "ace-editor": any;
    }
  }
}

export {};
