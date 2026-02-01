import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import generateFFMPEGParams from "./generateFFMPEGParams.js";
import type { Params } from "./generateFFMPEGParams.js";
import { extractMetadata } from "./extractMetadata.js";
import scaleWandH from "./scaleWandH.js";
import { timeHumanReadable } from "./timeHumanReadable.js";
import { determineBinaryAbsolutePath } from "./determineBinaryAbsolutePath.js";

export type CompressionStep = "first" | "second";

export type ProgressData = {
  progressPercentHuman: string;
  progressPercentNum: number;
  totalTimePassedMs: number;
  totalTimePassedHuman: string;
  estimatedTotalTimeMs: number;
  estimatedTotalTimeHuman: string;
  estimatedRemainingTimeMs: number;
  estimatedRemainingTimeHuman: string;
  firstPassDurationMs: number | null;
  firstPassDurationHuman: string;
};

/**
 * Full DriveCompressionOptions type fields:
 * {
 *   sourceFile: string;
 *   ffmpegPath?: string;
 *   ffprobePath?: string;
 *   date?: string;
 *
 *   scale: boolean;
 *   videoHeight?: number; // At least one of videoHeight or videoWidth must be provided
 *   videoWidth?: number;  // At least one of videoHeight or videoWidth must be provided
 *
 *   progressEvent?: (error: string | null, data: ProgressData) => void;
 *   end: (step: CompressionStep, error: string | null, duration: string) => void;
 *
 *   extra?: string[];
 *   extrafirst?: string[];
 *   extrasecond?: string[];
 * }
 */
export type DriveCompressionOptions = Omit<Params, "frameRate" | "videoHeight" | "videoWidth"> &
  (
    | { videoHeight: number; videoWidth?: number }
    | { videoWidth: number; videoHeight?: number }
    | { videoHeight: number; videoWidth: number }
  ) & {
    progressEvent?: (error: string | null, data: ProgressData) => void;
    end: (step: CompressionStep, error: string | null, duration: string) => void;
    ffmpegPath?: string;
    ffprobePath?: string;
    id?: string;
  };

/**
 * Sends a message back to the main process or triggers progress callbacks.
 */
export default async function driveCompression(options: DriveCompressionOptions) {
  const {
    sourceFile,

    scale = false,

    date,
    extra,
    extrafirst,
    extrasecond,
    progressEvent,
    end,
    ffmpegPath,
    ffprobePath,
    id = "ffmpeg2pass",
  } = options;

  let resolveFfmpegPath = ffmpegPath;
  if (!resolveFfmpegPath) {
    resolveFfmpegPath = determineBinaryAbsolutePath("ffmpeg");
  }

  let resolveFfprobePath = ffprobePath;
  if (!resolveFfprobePath) {
    resolveFfprobePath = determineBinaryAbsolutePath("ffprobe");
  }

  let { videoHeight, videoWidth } = options;

  let currentStep: CompressionStep = "first";
  const overallStartTime = Date.now();
  let firstPassDurationMs: number | null = null;
  let secondPassStartTime: number | null = null;
  let stepStartTime = Date.now();

  // 1. Setup a stable, writable directory for pass logs
  const logsDir = path.join(os.tmpdir(), "webm-compressor", "ffmpeg2pass");
  // passLogFilePrefix includes the unique Job ID to prevent collisions during parallel processing
  const passLogFilePrefix = path.join(logsDir, id);

  try {
    // Ensure the logs directory exists
    await fs.mkdir(logsDir, { recursive: true });
    console.log(`[DriveCompression] Using log prefix: ${passLogFilePrefix}`);

    // 2. Extract Metadata
    const {
      durationMs,
      height: metaHeight,
      width: metaWidth,
      fps: metaFps,
    } = await extractMetadata(resolveFfprobePath, sourceFile);

    if (scale) {
      ({ height: videoHeight, width: videoWidth } = scaleWandH({ height: metaHeight, width: metaWidth }, {
        height: videoHeight,
        width: videoWidth,
      } as any));
    }

    // 2. Prepare Parameters
    // We use extracted metadata to fill in missing required parameters or ensure accuracy
    const finalParams: Params = {
      sourceFile,
      videoHeight: (scale ? videoHeight : metaHeight) as number,
      videoWidth: (scale ? videoWidth : metaWidth) as number,
      frameRate: metaFps,
      scale,
      date,
      extra,
      extrafirst,
      extrasecond,
      passLogFilePrefix,
    };

    const { firstPass, secondPass } = generateFFMPEGParams(finalParams);

    /**
     * Helper to run an FFmpeg pass and report progress
     */
    const runPass = (flattenedArgs: string[], passNumber: number) => {
      return new Promise<void>((resolve, reject) => {
        const hasProgress = flattenedArgs.includes("-progress");

        if (passNumber === 2) {
          secondPassStartTime = Date.now();
        }

        const child = spawn(resolveFfmpegPath, flattenedArgs);

        let stderr = "";
        let stdoutBuffer = "";

        if (hasProgress) {
          child.stdout.on("data", (data: Buffer) => {
            stdoutBuffer += data.toString();
            const lines = stdoutBuffer.split("\n");
            stdoutBuffer = lines.pop() || "";

            for (const line of lines) {
              // Check for progress indicators
              const match = line.match(/out_time_ms=(\d+)/) || line.match(/out_time_us=(\d+)/);
              if (match) {
                const val = parseInt(match[1], 10);

                // WARNNG: Leave this comment
                // const currentMs = line.startsWith("out_time_ms")
                //   ? val
                //   : val / 1000;
                // //   out_time_us=1066667 from ffmpeg logs it seems we have both with the same value which is a bug
                // //   out_time_ms=1066667 and it it MICROseconds, not milliseconds
                // WARNNG: Leave this comment

                const currentMs = val / 1000;

                if (durationMs > 0 && progressEvent && secondPassStartTime) {
                  // Progress within this pass (0-100)
                  const passProgress = Math.min(100, (currentMs / durationMs) * 100);

                  const progress = parseFloat(passProgress.toFixed(2));

                  const now = Date.now();
                  const totalTimePassedMs = now - overallStartTime;
                  const secondPassTimePassedMs = now - secondPassStartTime;

                  let estimatedRemainingTimeMs = 0;
                  let estimatedTotalTimeMs = 0;

                  if (progress > 0) {
                    const onePercentTimeMs = secondPassTimePassedMs / progress;
                    estimatedRemainingTimeMs = Math.round((100 - progress) * onePercentTimeMs);
                    estimatedTotalTimeMs = totalTimePassedMs + estimatedRemainingTimeMs;
                  }

                  progressEvent(null, {
                    progressPercentHuman: progress.toFixed(2) + "%",
                    progressPercentNum: progress,
                    totalTimePassedMs,
                    totalTimePassedHuman: timeHumanReadable(totalTimePassedMs),
                    estimatedTotalTimeMs,
                    estimatedTotalTimeHuman: timeHumanReadable(estimatedTotalTimeMs),
                    estimatedRemainingTimeMs,
                    estimatedRemainingTimeHuman: timeHumanReadable(estimatedRemainingTimeMs),
                    firstPassDurationMs,
                    firstPassDurationHuman: firstPassDurationMs ? timeHumanReadable(firstPassDurationMs) : "?",
                  });
                }
              }
            }
          });
        }

        child.stderr.on("data", (data: Buffer) => {
          stderr += data.toString();
        });

        child.on("close", (code: number | null) => {
          if (code === 0) {
            if (hasProgress && progressEvent && secondPassStartTime) {
              const now = Date.now();
              const totalTimePassedMs = now - overallStartTime;
              progressEvent(null, {
                progressPercentHuman: "100.00%",
                progressPercentNum: 100,
                totalTimePassedMs,
                totalTimePassedHuman: timeHumanReadable(totalTimePassedMs),
                estimatedTotalTimeMs: totalTimePassedMs,
                estimatedTotalTimeHuman: timeHumanReadable(totalTimePassedMs),
                estimatedRemainingTimeMs: 0,
                estimatedRemainingTimeHuman: "0s",
                firstPassDurationMs,
                firstPassDurationHuman: firstPassDurationMs ? timeHumanReadable(firstPassDurationMs) : "?",
              });
            }
            resolve();
          } else {
            reject(
              new Error(`FFmpeg pass ${passNumber} failed with exit code ${code}${stderr ? `: ${stderr.trim()}` : ""}`),
            );
          }
        });

        child.on("error", (err: Error) => {
          reject(err);
        });
      });
    };

    // 3. Execute First Pass (Analysis phase)
    currentStep = "first";
    stepStartTime = Date.now();
    await runPass(firstPass.flat(2) as string[], 1);
    firstPassDurationMs = Date.now() - stepStartTime;
    end("first", null, timeHumanReadable(firstPassDurationMs));

    // 4. Execute Second Pass (Encoding phase)
    currentStep = "second";
    stepStartTime = Date.now();
    await runPass(secondPass.flat(2) as string[], 2);
    end("second", null, timeHumanReadable(Date.now() - overallStartTime));
  } catch (err: any) {
    // Notify about the error on the current step
    end(currentStep, err.message || String(err), timeHumanReadable(Date.now() - stepStartTime));
  } finally {
    // 5. Cleanup: Remove the pass logs for THIS job
    try {
      // FFmpeg appends '-0.log' to the prefix. We remove that specific file.
      const logFile = `${passLogFilePrefix}-0.log`;
      await fs.unlink(logFile).catch(() => {});
      console.log(`[DriveCompression] Cleaned up log for job: ${id}`);
    } catch (e) {
      console.warn(`[DriveCompression] Cleanup failed for job ${id}`, e);
    }
  }
}
