/**
 * WARNING:
 * This is just experimental script to use generateFFMPEGParams.ts library from cli
 * But in the final version of our app we won't be calling this script from cli
 * Instead we will be calling generateFFMPEGParams.ts library directly from electron app
 * So absolutely don't use this library in final application, stick to using directly generateFFMPEGParams.ts library
 * WARNING:
 *
 * NODE_OPTIONS="" /bin/bash ts.sh electron/src/tools/cli.ts -h 1080 -w 1920 -r 30 -sc -du 10050 -s "input.mp4"
 */

import { generateFFMPEGParamsStrings, type Params } from "./generateFFMPEGParams.js";
import { determineBinaryAbsolutePath } from "./determineBinaryAbsolutePath.js";

const args = process.argv.slice(2);

function printHelp() {
  process.stdout.write(`
Usage: ts.sh electron/tools/cli.ts [options]

Required arguments:
  -s, --sourceFile <path>      Path to the source video file.
  -h, --videoHeight <number>   Target video height.
  -w, --videoWidth <number>    Target video width.
  -r, --frameRate <number>     Target frame rate.

Optional arguments:
  -sc, --scale [true|false]    Whether to apply scaling. (default: false, but just --sc, --scale sets it to true)
  -du, --duration <number>     Duration in milliseconds.
  -d, --date <string>          Creation time metadata for the second pass. (default: current time)
  -e, --mainExec <path>        Path to the ffmpeg executable. (default: 'ffmpeg') - passing just  
                               -e "" will cause script to return just arguments
  -p, --pass <option>          Which pass parameters to return: 'both', 'firstPass', 'secondPass'. (default: 'both')
  --help                       Show this help message.

Example:
  NODE_OPTIONS="" /bin/bash ts.sh electron/tools/cli.ts -s "input.mp4" -h 1080 -w 1920 -r 30 -sc
  NODE_OPTIONS="" /bin/bash ts.sh electron/tools/cli.ts -s "input.mp4" -h 1080 -w 1920 -r 30 -sc -p "secondPass"
  NODE_OPTIONS="" /bin/bash ts.sh electron/tools/cli.ts -s "input.mp4" -h 1080 -w 1920 -r 30 -sc -p "firstPass" -e ""
`);

  process.exit(1);
}

if (args.length === 0 || args.includes("--help") || args.includes("/?")) {
  printHelp();
  process.exit(0);
}

type PassOption = "both" | "firstPass" | "secondPass";

const params: Partial<Params> & {
  pass: PassOption;
  mainExec: string;
} = {
  scale: false, // default scale to false
  pass: "both",
  mainExec: "",
};

params.mainExec = determineBinaryAbsolutePath("ffmpeg");

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  const nextArg = args[i + 1];

  switch (arg) {
    case "-s":
    case "--sourceFile":
      params.sourceFile = nextArg;
      i++;
      break;
    case "-h":
    case "--videoHeight":
      params.videoHeight = Number(nextArg);
      i++;
      break;
    case "-w":
    case "--videoWidth":
      params.videoWidth = Number(nextArg);
      i++;
      break;
    case "-r":
    case "--frameRate":
      params.frameRate = Number(nextArg);
      i++;
      break;
    case "-du":
    case "--duration":
      params.duration = Number(nextArg);
      i++;
      break;
    case "-sc":
    case "--scale":
      if (nextArg === "true" || nextArg === "false") {
        params.scale = nextArg === "true";
        i++;
      } else {
        params.scale = true;
      }
      break;
    case "-d":
    case "--date":
      params.date = nextArg;
      i++;
      break;
    case "-e":
    case "--mainExec":
      params.mainExec = nextArg || "";
      i++;
      break;
    case "-p":
    case "--pass":
      if (nextArg === "both" || nextArg === "firstPass" || nextArg === "secondPass") {
        params.pass = nextArg as PassOption;
      } else {
        console.error(`Error: -p, --pass must be one of 'both', 'firstPass', 'secondPass'`);
        process.exit(1);
      }
      i++;
      break;
  }
}

// Basic validation
const missing: string[] = [];
if (!params.sourceFile) missing.push("-s, --sourceFile");
if (params.videoHeight === undefined || isNaN(params.videoHeight)) missing.push("-h, --videoHeight (must be a number)");
if (params.videoWidth === undefined || isNaN(params.videoWidth)) missing.push("-w, --videoWidth (must be a number)");
if (params.frameRate === undefined || isNaN(params.frameRate)) missing.push("-r, --frameRate (must be a number)");

if (missing.length > 0) {
  console.error(`Error: Missing or invalid required arguments: ${missing.join(", ")}`);
  printHelp();
  process.exit(1);
}

const result = generateFFMPEGParamsStrings(params as Params);

let finalFirstPass = result.firstPass;
let finalSecondPass = result.secondPass;

if (params.mainExec) {
  finalFirstPass = `${params.mainExec} ${result.firstPass}`;
  finalSecondPass = `${params.mainExec} ${result.secondPass}`;
}

let buff: string[] = [];
switch (params.pass) {
  case "both":
    buff.push(finalFirstPass);
    buff.push(finalSecondPass);
    break;
  case "firstPass":
    buff.push(finalFirstPass);
    break;
  case "secondPass":
    buff.push(finalSecondPass);
    break;
}

process.stdout.write(buff.join("\n"));
