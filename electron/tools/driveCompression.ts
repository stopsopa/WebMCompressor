import { spawn } from "node:child_process";
import generateFFMPEGParams from "./generateFFMPEGParams.ts";
import type { Params } from "./generateFFMPEGParams.ts";
import { extractMetadata } from "./extractMetadata.ts";
import fs from "node:fs";

export type CompressionStep = "first" | "second";

export type DriveCompressionOptions = Omit<Params, "frameRate"> & {
  progressEvent?: (progressPercent: number) => void;
  end: (step: CompressionStep, error: string | null) => void;
  ffmpegPath?: string;
  ffprobePath?: string;
};

/**
 * Sends a message back to the main process or triggers progress callbacks.
 */
export default async function driveCompression(
  options: DriveCompressionOptions,
) {
  const {
    sourceFile,
    videoHeight,
    videoWidth,
    scale,
    date,
    extra,
    extrafirst,
    extrasecond,
    progressEvent,
    end,
    ffmpegPath = "ffmpeg",
    ffprobePath = "ffprobe",
  } = options;

  let currentStep: CompressionStep = "first";

  try {
    // 1. Extract Metadata to get duration for progress calculation
    const {
      durationMs,
      height: metaHeight,
      width: metaWidth,
      fps: metaFps,
    } = await extractMetadata(ffprobePath, sourceFile);

    // 2. Prepare Parameters
    // We use extracted metadata to fill in missing required parameters or ensure accuracy
    const finalParams: Params = {
      sourceFile,
      videoHeight: scale ? videoHeight : metaHeight,
      videoWidth: scale ? videoWidth : metaWidth,
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

        const child = spawn(ffmpegPath, flattenedArgs);

        let stderr = "";
        let stdoutBuffer = "";

        if (hasProgress) {
          child.stdout.on("data", (data: Buffer) => {
            stdoutBuffer += data.toString();
            const lines = stdoutBuffer.split("\n");
            stdoutBuffer = lines.pop() || "";

            for (const line of lines) {
              fs.appendFileSync("progress.txt", `\n---------\n${line}`);
              // Check for progress indicators
              const match =
                line.match(/out_time_ms=(\d+)/) ||
                line.match(/out_time_us=(\d+)/);
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

                if (durationMs > 0 && progressEvent) {
                  // Progress within this pass (0-100)
                  const passProgress = Math.min(
                    100,
                    (currentMs / durationMs) * 100,
                  );

                  const progress = parseFloat(passProgress.toFixed(2));

                  if (progress > 90) {
                    var k = "test";
                  }

                  // Report progress directly (assuming only Pass 2 has -progress)
                  progressEvent(progress);
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
            if (hasProgress && progressEvent) {
              // Mark the end of this pass explicitly if it had progress tracking
              progressEvent(100);
            }
            resolve();
          } else {
            reject(
              new Error(
                `FFmpeg pass ${passNumber} failed with exit code ${code}${stderr ? `: ${stderr.trim()}` : ""}`,
              ),
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
    await runPass(firstPass.flat(2) as string[], 1);
    end("first", null);

    // 4. Execute Second Pass (Encoding phase)
    currentStep = "second";
    await runPass(secondPass.flat(2) as string[], 2);
    end("second", null);
  } catch (err: any) {
    // Notify about the error on the current step
    end(currentStep, err.message || String(err));
  }
}
