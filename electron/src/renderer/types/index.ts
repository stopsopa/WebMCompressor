export interface VideoFile {
  id: string;
  path: string;
  name: string;
  outputPath: string;
  width: number;
  height: number;
  fps: number;
  durationMs: number;
  settings: CompressionSettings;
  status: "validating" | "queued" | "processing" | "complete" | "error";
  progress: number; // 0-100
  error: string | null;
  startTime: number | null;
  endTime: number | null;
  currentPass: 1 | 2 | null;
  isEditing?: boolean;
}

export interface CompressionSettings {
  scale: boolean;
  videoHeight?: number;
  videoWidth?: number;
}

export interface AppConfig {
  scale: boolean;
  videoWidth: number | null;
  videoHeight: number | null;
}

export interface FFmpegProgress {
  frame: number;
  fps: number;
  bitrate: string;
  totalSize: number;
  outTimeMs: number;
  outTime: string;
  dupFrames: number;
  dropFrames: number;
  speed: number;
  progress: number;
}

export interface LogEntry {
  timestamp: number;
  fileId: string;
  fileName: string;
  level: "info" | "error" | "warn";
  message: string;
  pass?: 1 | 2;
}
