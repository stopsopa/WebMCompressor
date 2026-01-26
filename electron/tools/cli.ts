/**
 * /bin/bash ts.sh electron/tools/cli.ts --sourceFile "test.mp4" --videoHeight 1080 --videoWidth 1920 --frameRate 30 --pass "secondPass"
 */

import generateFFMPEGParams, { type Params } from "./generateFFMPEGParams.ts";

const args = process.argv.slice(2);

function printHelp() {
  console.log(`
Usage: ts.sh electron/tools/cli.ts [options]

Required arguments:
  --sourceFile <path>      Path to the source video file.
  --videoHeight <number>   Target video height.
  --videoWidth <number>    Target video width.
  --frameRate <number>     Target frame rate.

Optional arguments:
  --scale [true|false]     Whether to apply scaling. (default: false, but just --scale sets it to true)
  --date <string>          Creation time metadata for the second pass. (default: current time)
  --mainExec <path>        Path to the ffmpeg executable. (default: 'ffmpeg')
  --pass <option>          Which pass parameters to return: 'both', 'firstPass', 'secondPass'. (default: 'both')
  --help                   Show this help message.

Example:
  /bin/bash ts.sh electron/tools/cli.ts --sourceFile "input.mp4" --videoHeight 1080 --videoWidth 1920 --frameRate 30 --pass "secondPass"
`);
}

if (args.length === 0 || args.includes("--help")) {
  printHelp();
  process.exit(0);
}

type PassOption = "both" | "firstPass" | "secondPass";

const params: Partial<Params> & { pass: PassOption } = {
  scale: false, // default scale to false
  pass: "both",
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  const nextArg = args[i + 1];

  switch (arg) {
    case "--sourceFile":
      params.sourceFile = nextArg;
      i++;
      break;
    case "--videoHeight":
      params.videoHeight = Number(nextArg);
      i++;
      break;
    case "--videoWidth":
      params.videoWidth = Number(nextArg);
      i++;
      break;
    case "--frameRate":
      params.frameRate = Number(nextArg);
      i++;
      break;
    case "--scale":
      if (nextArg === "true" || nextArg === "false") {
        params.scale = nextArg === "true";
        i++;
      } else {
        params.scale = true;
      }
      break;
    case "--date":
      params.date = nextArg;
      i++;
      break;
    case "--mainExec":
      params.mainExec = nextArg;
      i++;
      break;
    case "--pass":
      if (
        nextArg === "both" ||
        nextArg === "firstPass" ||
        nextArg === "secondPass"
      ) {
        params.pass = nextArg as PassOption;
      } else {
        console.error(
          `Error: --pass must be one of 'both', 'firstPass', 'secondPass'`,
        );
        process.exit(1);
      }
      i++;
      break;
  }
}

// Basic validation
const missing: string[] = [];
if (!params.sourceFile) missing.push("--sourceFile");
if (params.videoHeight === undefined || isNaN(params.videoHeight))
  missing.push("--videoHeight (must be a number)");
if (params.videoWidth === undefined || isNaN(params.videoWidth))
  missing.push("--videoWidth (must be a number)");
if (params.frameRate === undefined || isNaN(params.frameRate))
  missing.push("--frameRate (must be a number)");

if (missing.length > 0) {
  console.error(
    `Error: Missing or invalid required arguments: ${missing.join(", ")}`,
  );
  printHelp();
  process.exit(1);
}

const result = generateFFMPEGParams(params as Params);

if (params.pass === "both") {
  console.log(JSON.stringify(result, null, 4));
} else if (params.pass === "firstPass") {
  console.log(result.firstPass);
} else if (params.pass === "secondPass") {
  console.log(result.secondPass);
}
