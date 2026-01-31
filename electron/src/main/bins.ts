import path from "node:path";
import { app } from "electron";
import { existsSync } from "node:fs";

export function getFFmpegPath(): string {
  if (app.isPackaged) {
    const platform = process.platform;
    const arch = process.arch;
    const exe = platform === "win32" ? "ffmpeg.exe" : "ffmpeg";

    // Primary path: resources/bin/[platform]/[arch]/ffmpeg
    let fullPath = path.join(process.resourcesPath, "bin", platform, arch, exe);

    // Fallback for macOS: if arm64 not found, try x64 (Rosetta)
    if (platform === "darwin" && !existsSync(fullPath)) {
      const fallbackArch = arch === "arm64" ? "x64" : "arm64";
      const fallbackPath = path.join(process.resourcesPath, "bin", platform, fallbackArch, exe);
      if (existsSync(fallbackPath)) {
        console.log(`[Bins] FFmpeg ${arch} not found, using fallback ${fallbackArch}: ${fallbackPath}`);
        return fallbackPath;
      }
    }

    console.log(`[Bins] Packaged FFmpeg path (arch: ${arch}): ${fullPath}`);
    return fullPath;
  }

  // In development, use the downloaded binaries in electron/bin
  const platform = process.platform;
  const arch = process.arch;
  const exe = platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  const devPath = path.join(app.getAppPath(), "bin", platform, arch, exe);

  if (platform === "darwin" && !existsSync(devPath)) {
    const fallbackArch = arch === "arm64" ? "x64" : "arm64";
    const fallbackPath = path.join(app.getAppPath(), "bin", platform, fallbackArch, exe);
    if (existsSync(fallbackPath)) {
      console.log(`[Bins] Dev FFmpeg ${arch} not found, using fallback ${fallbackArch}: ${fallbackPath}`);
      return fallbackPath;
    }
  }

  console.log(`[Bins] Dev FFmpeg path: ${devPath}`);
  return devPath;
}

export function getFFprobePath(): string {
  if (app.isPackaged) {
    const platform = process.platform;
    const arch = process.arch;
    const exe = platform === "win32" ? "ffprobe.exe" : "ffprobe";

    // Primary path: resources/bin/[platform]/[arch]/ffprobe
    let fullPath = path.join(process.resourcesPath, "bin", platform, arch, exe);

    // Fallback for macOS: if arm64 not found, try x64 (Rosetta)
    if (platform === "darwin" && !existsSync(fullPath)) {
      const fallbackArch = arch === "arm64" ? "x64" : "arm64";
      const fallbackPath = path.join(process.resourcesPath, "bin", platform, fallbackArch, exe);
      if (existsSync(fallbackPath)) {
        console.log(`[Bins] FFprobe ${arch} not found, using fallback ${fallbackArch}: ${fallbackPath}`);
        return fallbackPath;
      }
    }

    console.log(`[Bins] Packaged FFprobe path (arch: ${arch}): ${fullPath}`);
    return fullPath;
  }

  // In development, use the downloaded binaries in electron/bin
  const platform = process.platform;
  const arch = process.arch;
  const exe = platform === "win32" ? "ffprobe.exe" : "ffprobe";
  const devPath = path.join(app.getAppPath(), "bin", platform, arch, exe);

  if (platform === "darwin" && !existsSync(devPath)) {
    const fallbackArch = arch === "arm64" ? "x64" : "arm64";
    const fallbackPath = path.join(app.getAppPath(), "bin", platform, fallbackArch, exe);
    if (existsSync(fallbackPath)) {
      console.log(`[Bins] Dev FFprobe ${arch} not found, using fallback ${fallbackArch}: ${fallbackPath}`);
      return fallbackPath;
    }
  }

  console.log(`[Bins] Dev FFprobe path: ${devPath}`);
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
