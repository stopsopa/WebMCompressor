import closestResolution from "./closestResolution.ts";
import determineBitrate from "./determineBitrate.ts";

type Params = {
  videoHeight: number;
  videoWidth: number;
  originalHeight: boolean; // this is to inform that we will rescale
  sourceFile: string;
};

/**
 * Logic based on: https://developers.google.com/media/vp9/settings/vod/
 */
export default function generateFFMPEGParams(params: Params) {
  const { videoHeight, videoWidth, originalHeight, sourceFile } = params;

  const { avg, min, max } = determineBitrate(videoHeight);

  return [
    "-c:v",
    "libvpx-vp9",
    "-b:v",
    "3000k",
    "-minrate",
    "1500k",
    "-maxrate",
    "4350k",
    "-tile-columns",
    "4",
    "-g",
    "240",
    "-threads",
    "4",
    "-quality",
    "good",
    "-speed",
    "4",
    "-crf",
    "32",
    "-pass",
    "1",
    "-an",
    "-f",
    "null",
    "/dev/null",
  ];
}
