import driveCompression from "./driveCompression.ts";

const sourceFile =
  "example/S1_E5_Sekret_Maczugi__The_Secret_Of_The_Club[short].mov";

console.log(`Starting compression for: ${sourceFile}`);

/**
 * /bin/bash ts.sh electron/tools/driveCompression.run.ts
 */
driveCompression({
  sourceFile,
  videoHeight: 360, // Arbitrary, will be overridden or used
  videoWidth: 640,
  scale: false,
  progressEvent: (progress) => {
    console.log(`Progress: ${progress.toFixed(2)}%`);
  },
  end: (step, error) => {
    if (error) {
      console.error(`Compression failed during ${step} pass: ${error}`);
      process.exit(1);
    } else {
      console.log(`Step ${step} finished successfully!`);
      if (step === "second") {
        console.log("Entire process finished!");
        process.exit(0);
      }
    }
  },
});
