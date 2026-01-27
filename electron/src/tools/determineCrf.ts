import { closestHeight } from "./closestResolution.js";
import type { HeightResolution } from "./closestResolution.js";

const crfValues: Record<HeightResolution, number> = {
  240: 37,
  360: 36,
  480: 33,
  720: 32,
  1080: 31,
  1440: 24,
  2160: 15,
};

/**
 * based on: https://developers.google.com/media/vp9/settings/vod/#quality
 */
export default function determineCrf(videoHeight: number): number {
  const targetHeight = closestHeight(videoHeight);

  return crfValues[targetHeight];
}
