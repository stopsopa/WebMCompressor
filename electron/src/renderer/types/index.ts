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
}

export interface CompressionSettings {
  scale: boolean;
  height?: number;
  width?: number;
}

export type QualityPreset = "ultra" | "high" | "medium" | "low" | "tiny";
export type ResolutionMode = "original" | "maxWidth" | "maxHeight";

export interface QualityPresetConfig {
  crf: number;
  bitrate: number; // in kbps
  minBitrate: number;
  maxBitrate: number;
}

export const QUALITY_PRESETS: Record<QualityPreset, QualityPresetConfig> = {
  ultra: { crf: 24, bitrate: 5000, minBitrate: 2500, maxBitrate: 7250 },
  high: { crf: 28, bitrate: 3000, minBitrate: 1500, maxBitrate: 4350 },
  medium: { crf: 32, bitrate: 1800, minBitrate: 900, maxBitrate: 2610 },
  low: { crf: 36, bitrate: 1000, minBitrate: 500, maxBitrate: 1450 },
  tiny: { crf: 40, bitrate: 500, minBitrate: 250, maxBitrate: 725 },
};

export interface AppConfig {
  defaultQuality: QualityPreset;
  defaultResolution: ResolutionMode;
  maxWidth: number | null;
  maxHeight: number | null;
  sizePerSecond: number | null; // KB/s
  parallelProcessing: number;
  overwriteExisting: boolean;
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
