import { closestHeight, closestWidth } from "./closestResolution.ts";
import determineBitrate from "./determineBitrate.ts";
import categorizeFrameRate from "./categorizeFrameRate.ts";
import determineTilingAndThreading from "./determineTilingAndThreading.ts";
import determineMultipassSpeed from "./determineMultipassSpeed.ts";
import determineCrf from "./determineCrf.ts";
import determineName from "./determineName.ts";

export type Params = {
  sourceFile: string;

  videoHeight: number;
  videoWidth: number;
  frameRate: number;

  scale: boolean; // this is to inform to scale
  date?: string; // mainly to fix it for testing
};

/**
 * Logic based on: https://developers.google.com/media/vp9/settings/vod/
 */
export default function generateFFMPEGParams(params: Params) {
  const { videoHeight, videoWidth, scale, sourceFile, frameRate } = params;

  let { date } = params;

  const outputFileName = determineName(sourceFile, "webm");

  const categorizedFrameRate = categorizeFrameRate(frameRate);

  const crf = determineCrf(videoHeight);

  const { firstPass, secondPass } = determineMultipassSpeed(videoHeight);

  const { avg, min, max } = determineBitrate(videoHeight, categorizedFrameRate);

  const bufferfp: string[] = []; // first pass

  bufferfp.push(`-loglevel error -c:v libvpx-vp9 -c:a libopus`);
  bufferfp.push(`-i "${sourceFile.replace(/"/g, '\\"')}"`);

  if (scale) {
    bufferfp.push(`-vf scale=${videoWidth}x${videoHeight}`);
  }
  bufferfp.push(`-b:v ${avg}k -minrate ${min}k -maxrate ${max}k`);

  const { tileColumns, threads } = determineTilingAndThreading(videoWidth);

  bufferfp.push(`-tile-columns ${tileColumns} -threads ${threads}`);

  bufferfp.push(`-g 240`);
  bufferfp.push(`-quality good`);
  bufferfp.push(`-crf ${crf}`);

  const buffersp = [...bufferfp];

  bufferfp.push(`-speed ${firstPass}`);
  buffersp.push(`-speed ${secondPass}`);

  bufferfp.push(`-pass 1 -an -f null /dev/null`);
  if (!date) {
    // 2026-01-25T01:44:58.000Z
    date = new Date().toISOString();
  }
  buffersp.push(
    `-pass 2 -metadata creation_time="${date}" -metadata comment="sayonara" -y "${outputFileName.replace(/"/g, '\\"')}"`,
  );

  return {
    firstPass: bufferfp.join(" "),
    secondPass: buffersp.join(" "),
  };
}
