/// <reference types="vite/client" />

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
