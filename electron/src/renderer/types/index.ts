export interface VideoFile {
  id: string;
  path: string;
  name: string;
  outputPath: string;
  width: number;
  height: number;
  fps: number;
  durationMs: number;
  size: number;
  settings: FormSettings;
  status: "validating" | "queued" | "processing" | "complete" | "error";
  progress: number; // 0-100
  error: string | null;
  startTime: number | null;
  endTime: number | null;
  currentPass: 1 | 2 | null;
  isEditing?: boolean;
  // Phase 5 additions
  pass1Duration?: string;
  pass2Duration?: string;
  pass2ProgressData?: {
    progressPercentNum: number;
    totalTimePassedHuman: string;
    estimatedTotalTimeHuman: string;
    estimatedRemainingTimeHuman: string;
  };
}

export interface FormSettings {
  scale: boolean;
  videoWidth: number | null;
  videoHeight: number | null;
}

export interface GlobalSettings {
  parallelProcessing: number;
}

export interface AppConfig {
  form: FormSettings;
  settings: GlobalSettings;
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
