import path from "node:path";
import { app } from "electron";
import ffmpegPath from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";

const ffprobePath = ffprobeStatic.path;

export function getFFmpegPath(): string {
  if (app.isPackaged) {
    const platform = process.platform;
    const arch = process.arch;
    const exe = platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
    return path.join(process.resourcesPath, "bin", platform, arch, exe);
  }

  // In development, use the ones from node_modules
  return ffmpegPath as any as string;
}

export function getFFprobePath(): string {
  if (app.isPackaged) {
    const platform = process.platform;
    const arch = process.arch;
    const exe = platform === "win32" ? "ffprobe.exe" : "ffprobe";
    return path.join(process.resourcesPath, "bin", platform, arch, exe);
  }

  // In development, use the one from node_modules
  return ffprobePath!;
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
