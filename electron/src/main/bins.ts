import path from "node:path";
import { app } from "electron";
import { determineBinaryAbsolutePath } from "../tools/determineBinaryAbsolutePath.js";

export function getFFmpegPath(): string {
  if (app.isPackaged) {
    const binDir = path.join(process.resourcesPath, "bin");
    const fullPath = determineBinaryAbsolutePath("ffmpeg", binDir);
    console.log(`[Bins] Packaged FFmpeg path resolved via tool: ${fullPath}`);
    return fullPath;
  }

  // In development, use the downloaded binaries in electron/bin
  const devPath = determineBinaryAbsolutePath("ffmpeg");
  console.log(`[Bins] Dev FFmpeg path resolved via tool: ${devPath}`);
  return devPath;
}

export function getFFprobePath(): string {
  if (app.isPackaged) {
    const binDir = path.join(process.resourcesPath, "bin");
    const fullPath = determineBinaryAbsolutePath("ffprobe", binDir);
    console.log(`[Bins] Packaged FFprobe path resolved via tool: ${fullPath}`);
    return fullPath;
  }

  // In development, use the downloaded binaries in electron/bin
  const devPath = determineBinaryAbsolutePath("ffprobe");
  console.log(`[Bins] Dev FFprobe path resolved via tool: ${devPath}`);
  return devPath;
}

export async function getVersions(): Promise<{ ffmpeg: string; ffprobe: string }> {
  const { exec } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execAsync = promisify(exec);

  const getV = async (bin: string) => {
    try {
      const { stdout } = await execAsync(`"${bin}" -version`);
      const firstLine = stdout.split("\n")[0];
      // ffmpeg version 6.1.1-static ... -> 6.1.1-static
      const match = firstLine.match(/version\s+([^\s]+)/);
      return match ? match[1] : "unknown";
    } catch (e) {
      console.error(`Failed to get version for ${bin}:`, e);
      return "error";
    }
  };

  return {
    ffmpeg: await getV(getFFmpegPath()),
    ffprobe: await getV(getFFprobePath()),
  };
}
