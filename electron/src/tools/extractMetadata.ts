/**
 * Production ready version of logic from extractMetadata.sh - don't use extractMetadata.sh in final app
 * NODE_OPTIONS="" /bin/bash ts.sh electron/tools/extractMetadata.ts "[FILE]"
 */

import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";

import { determineBinaryAbsolutePath } from "./determineBinaryAbsolutePath.js";

const th = (msg: string) => new Error(`extractMetadata.ts error: ${msg}`);

/**
 * Extracts width, height, FPS and duration from a video file using ffprobe.
 * Logic based on extractMetadata.sh
 */
export async function extractMetadata(ffprobePath: string | undefined, filePath: string) {
  if (!ffprobePath) {
    ffprobePath = determineBinaryAbsolutePath("ffprobe");
  }
  if (!existsSync(filePath)) {
    throw th(`File not found: ${filePath}`);
  }

  // ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${FILE}"
  const args = [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height,r_frame_rate",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ];

  try {
    if (!existsSync(ffprobePath)) {
      throw th(`ffprobe binary not found at path: ${ffprobePath}`);
    }

    const result = spawnSync(ffprobePath, args, { encoding: "utf8" });

    if (result.error) {
      throw th(`ffprobe failed to spawn: ${result.error.message} (path: ${ffprobePath})`);
    }

    if (result.status !== 0) {
      throw th(
        `ffprobe failed with exit code ${result.status}${result.stderr ? `: ${result.stderr.trim()}` : ""} (path: ${ffprobePath})`,
      );
    }

    const output = result.stdout.trim();
    // Use a regex to catch all possible line endings and filter out empty strings
    const lines = output.split(/\s+/).filter((line: string) => line.trim() !== "");

    if (lines.length !== 4) {
      throw th(`Invalid output from ffprobe (expected 4 values, got ${lines.length}):\n${output}`);
    }

    const [widthStr, heightStr, fpsRaw, durationStr] = lines;

    const width = parseInt(widthStr, 10);
    const height = parseInt(heightStr, 10);

    // normalize FPS: take only leading digits from the beginning (e.g. 60/1 -> 60)
    // The shell script does: if [[ "${FPS}" =~ ^([0-9]+) ]]; then FPS="${BASH_REMATCH[1]}"
    const fpsMatch = fpsRaw.match(/^([0-9]+)/);
    const fps = fpsMatch ? parseInt(fpsMatch[1], 10) : NaN;

    const durationSeconds = parseFloat(durationStr);
    /**
     * DURATION=$(awk "BEGIN { print int(${DURATION} * 1000) }")
     */
    const durationMs = Math.floor(durationSeconds * 1000);

    // Validation like in the shell script
    if (isNaN(width) || !/^\d+$/.test(widthStr)) {
      throw th(`Invalid width from ffprobe: ${widthStr}`);
    }
    if (isNaN(height) || !/^\d+$/.test(heightStr)) {
      throw th(`Invalid height from ffprobe: ${heightStr}`);
    }
    if (isNaN(fps)) {
      throw th(`Invalid fps from ffprobe: ${fpsRaw}`);
    }
    if (isNaN(durationSeconds) || !/^[0-9]+(\.[0-9]+)?$/.test(durationStr)) {
      throw th(`Invalid duration from ffprobe: ${durationStr}`);
    }

    const stats = statSync(filePath);

    return {
      width,
      height,
      fps,
      durationMs,
      size: stats.size,
    };
  } catch (error: any) {
    throw error;
  }
}

if (import.meta?.main) {
  (async () => {
    try {
      const file = process.argv[2];

      if (!file) {
        console.error(`Usage: node extractMetadata.ts <file>`);
        process.exit(1);
      }

      const ffprobePath = determineBinaryAbsolutePath("ffprobe");

      const meta = await extractMetadata(ffprobePath, file);
      process.stdout.write(`${meta.width}\n`);
      process.stdout.write(`${meta.height}\n`);
      process.stdout.write(`${meta.fps}\n`);
      process.stdout.write(`${meta.durationMs}`); // no trailing newline as per shell script
    } catch (err: any) {
      console.error(`${process.argv[1]} error: ${err.message}`);
      process.exit(1);
    }
  })();
}
