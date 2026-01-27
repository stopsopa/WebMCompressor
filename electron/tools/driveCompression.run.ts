import driveCompression from "./driveCompression.ts";

let sourceFile;
sourceFile = "example/S1_E5_Sekret_Maczugi__The_Secret_Of_The_Club[short].mov";
sourceFile = "example/S1_E5_Sekret_Maczugi__The_Secret_Of_The_Club.mov";

console.log(`Starting compression for: ${sourceFile}`);

/**
 * /bin/bash ts.sh electron/tools/driveCompression.run.ts
 */
driveCompression({
  sourceFile,
  videoHeight: 360, // Arbitrary, will be overridden or used
  videoWidth: 640,
  scale: true,
  progressEvent: (error, data) => {
    if (error) {
      console.error(`Progress error: ${error}`);
      return;
    }
    const { progressPercent, totalTimePassedMs, estimatedTotalTimeMs, estimatedRemainingTimeMs, firstPassDurationMs } =
      data;
    const passedS = (totalTimePassedMs / 1000).toFixed(1);
    const totalS = (estimatedTotalTimeMs / 1000).toFixed(1);
    const remainingS = (estimatedRemainingTimeMs / 1000).toFixed(1);
    const firstS = firstPassDurationMs ? (firstPassDurationMs / 1000).toFixed(1) : "?";

    console.log(
      `Progress: ${progressPercent.toFixed(2)}% | Passed: ${passedS}s (1st: ${firstS}s) | Total: ${totalS}s | Remaining: ${remainingS}s`,
    );
  },
  end: (step, error) => {
    if (error) {
      console.error(`Compression failed during ${step} pass: ${error}`);
      process.exit(1);
    } else {
      console.log(`end(): Step ${step} finished successfully!`);
      if (step === "second") {
        console.log("ALL GOOD");
        process.exit(0);
      }
    }
  },
});

// prints:
// Starting compression for: example/S1_E5_Sekret_Maczugi__The_Secret_Of_The_Club[short].mov
// end(): Step first finished successfully!
// Progress: 1.28% | Passed: 8.6s (1st: 6.8s) | Total: 133.7s | Remaining: 125.1s
// Progress: 1.28% | Passed: 8.6s (1st: 6.8s) | Total: 133.7s | Remaining: 125.1s
// Progress: 4.47% | Passed: 9.1s (1st: 6.8s) | Total: 54.5s | Remaining: 45.4s
// Progress: 4.47% | Passed: 9.1s (1st: 6.8s) | Total: 54.5s | Remaining: 45.4s
// Progress: 4.47% | Passed: 9.6s (1st: 6.8s) | Total: 65.8s | Remaining: 56.2s
// Progress: 4.47% | Passed: 9.6s (1st: 6.8s) | Total: 65.8s | Remaining: 56.2s
// ...
// Progress: 85.97% | Passed: 50.8s (1st: 6.8s) | Total: 58.0s | Remaining: 7.2s
// Progress: 85.97% | Passed: 50.8s (1st: 6.8s) | Total: 58.0s | Remaining: 7.2s
// Progress: 85.97% | Passed: 51.3s (1st: 6.8s) | Total: 58.6s | Remaining: 7.2s
// Progress: 85.97% | Passed: 51.3s (1st: 6.8s) | Total: 58.6s | Remaining: 7.2s
// Progress: 87.57% | Passed: 51.8s (1st: 6.8s) | Total: 58.2s | Remaining: 6.4s
// Progress: 87.57% | Passed: 51.8s (1st: 6.8s) | Total: 58.2s | Remaining: 6.4s
// Progress: 99.71% | Passed: 56.5s (1st: 6.8s) | Total: 56.7s | Remaining: 0.1s
// Progress: 99.71% | Passed: 56.5s (1st: 6.8s) | Total: 56.7s | Remaining: 0.1s
// Progress: 100.00% | Passed: 56.5s (1st: 6.8s) | Total: 56.5s | Remaining: 0.0s
// end(): Step second finished successfully!
// ALL GOOD
// Waiting for the debugger to disconnect...
