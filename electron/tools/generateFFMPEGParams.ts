import { closestWidth } from "./closestResolution.ts";
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

}
