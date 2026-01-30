import { closestHeight, closestWidth } from "./closestResolution.js";
import determineBitrate from "./determineBitrate.js";
import categorizeFrameRate from "./categorizeFrameRate.js";
import determineTilingAndThreading from "./determineTilingAndThreading.js";
import determineMultipassSpeed from "./determineMultipassSpeed.js";
import determineCrf from "./determineCrf.js";
import determineName from "./determineName.js";

export type Params = {
  sourceFile: string;

  videoHeight: number;
  videoWidth: number;
  frameRate: number;

  scale: boolean; // this is to inform to scale
  date?: string; // mainly to fix it for testing
  extra?: string[]; // some extra parameters like -ss 00:00:17 -to 00:00:22 for cutting video
  extrafirst?: string[]; // or granurally for first pass
  extrasecond?: string[]; // or granurally for second pass
  passLogFilePrefix?: string; // where to save multi-pass log file
};

type NestedStringArray = (string | string[])[];

/**
 * Logic based on: https://developers.google.com/media/vp9/settings/vod/
 * WARNING:
 *   be aware that in returned arrays might be nested arrays with strings
 *   so array with strings but with two levels nested
 * these arrays will have to be flattened with .flat(2) to be ready to be passed to spawnSync("ffprobe", args, { encoding: "utf8" });
 * and also this library returns only arguments for ffmpeg but ffmpeg binary path will have to be determined in electron app for spawnSync()
 * application should be shipped with ffmpeg binary and ffprobe binary
 */
export default function generateFFMPEGParams(params: Params): {
  firstPass: NestedStringArray;
  secondPass: NestedStringArray;
} {
  const { videoHeight, videoWidth, scale, sourceFile, frameRate, extra, extrafirst, extrasecond, passLogFilePrefix } =
    params;

  let { date } = params;

  let outputFileName = determineName(sourceFile, "webm");

  const categorizedFrameRate = categorizeFrameRate(frameRate);

  const crf = determineCrf(videoHeight);

  const { firstPass, secondPass } = determineMultipassSpeed(videoHeight);

  const { avg, min, max } = determineBitrate(videoHeight, categorizedFrameRate);

  const bufferfp: (string | string[])[] = []; // first pass

  bufferfp.push(["-loglevel", "error"]);
  bufferfp.push(["-i", sourceFile]); // remember about this one
  bufferfp.push(["-c:v", "libvpx-vp9"]);

  if (scale) {
    bufferfp.push(["-vf", `scale=${videoWidth}x${videoHeight}`]);
  }

  bufferfp.push([`-b:v`, `${avg}k`, `-minrate`, `${min}k`, `-maxrate`, `${max}k`]);

  const { tileColumns, threads } = determineTilingAndThreading(videoWidth);

  bufferfp.push([`-tile-columns`, String(tileColumns), `-threads`, String(threads)]);

  bufferfp.push([`-g`, `240`]);
  bufferfp.push([`-quality`, `good`]);
  bufferfp.push([`-crf`, String(crf)]);

  const buffersp = structuredClone(bufferfp);

  buffersp[0] = [`-loglevel`, `error`, `-progress`, `-`]; // add -progress - to second pass

  bufferfp.push([`-speed`, String(firstPass)]);
  buffersp.push([`-speed`, String(secondPass)]);

  bufferfp.push([`-an`]);
  buffersp.push([`-c:a`, `libopus`]);

  if (Array.isArray(extra)) {
    bufferfp.push(extra);
    buffersp.push(extra);
  }

  if (Array.isArray(extrafirst)) {
    bufferfp.push(extrafirst);
  }

  if (Array.isArray(extrasecond)) {
    buffersp.push(extrasecond);
  }

  if (passLogFilePrefix) {
    bufferfp.push([`-passlogfile`, passLogFilePrefix]);
    buffersp.push([`-passlogfile`, passLogFilePrefix]);
  }

  bufferfp.push([`-pass`, `1`, `-f`, `null`, `/dev/null`]);

  if (!date) {
    // 2026-01-25T01:44:58.000Z
    date = new Date().toISOString();
  }
  buffersp.push([`-pass`, `2`, `-metadata`, `creation_time="${date}"`, `-metadata`, `comment="sayonara"`]);

  buffersp.push([`-y`, outputFileName]);

  return {
    firstPass: bufferfp,
    secondPass: buffersp,
  };
}

export function generateFFMPEGParamsStrings(params: Params) {
  const { firstPass, secondPass } = generateFFMPEGParams(params);

  // .replace(/"/g, '\\"') for bufferfp.push(["-i", sourceFile]);   and outputFileName before

  const fp1 = firstPass[1];
  if (Array.isArray(fp1) && typeof fp1[1] === "string") {
    fp1[1] = `"${fp1[1].replace(/"/g, '\\"')}"`;
  }
  const sp1 = secondPass[1];
  if (Array.isArray(sp1) && typeof sp1[1] === "string") {
    sp1[1] = `"${sp1[1].replace(/"/g, '\\"')}"`;
  }

  // update the same way secondPass
  // but this time we have to look element array with first element '-y' and then do .replace(/"/g, '\\"')  on the second string on that array
  const sp2 = secondPass.find((el) => Array.isArray(el) && el[0] === "-y") as string[];
  if (sp2 && typeof sp2[1] === "string") {
    sp2[1] = `"${sp2[1].replace(/"/g, '\\"')}"`;
  }

  return {
    firstPass: firstPass.flat(2).join(" "),
    secondPass: secondPass.flat(2).join(" "),
  };
}
