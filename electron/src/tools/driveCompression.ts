import { spawn } from "node:child_process";
import generateFFMPEGParams from "./generateFFMPEGParams.ts";
import type { Params } from "./generateFFMPEGParams.ts";
import { extractMetadata } from "./extractMetadata.ts";
import scaleWandH from "./scaleWandH.ts";
import { timeHumanReadable } from "./timeHumanReadable.ts";

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
    ffmpegPath = "ffmpeg",
    ffprobePath = "ffprobe",
  } = options;

  let { videoHeight, videoWidth } = options;

  let currentStep: CompressionStep = "first";
  const overallStartTime = Date.now();
  let firstPassDurationMs: number | null = null;
  let secondPassStartTime: number | null = null;
  let stepStartTime = Date.now();

  try {
    // 1. Extract Metadata to get duration for progress calculation
    const {
      durationMs,
      height: metaHeight,
      width: metaWidth,
      fps: metaFps,
    } = await extractMetadata(ffprobePath, sourceFile);

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

        const child = spawn(ffmpegPath, flattenedArgs);

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
    end("second", null, timeHumanReadable(Date.now() - stepStartTime));
  } catch (err: any) {
    // Notify about the error on the current step
    end(currentStep, err.message || String(err), timeHumanReadable(Date.now() - stepStartTime));
  }
}
