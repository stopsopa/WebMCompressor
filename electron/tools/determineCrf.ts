import closestResolution from "./closestResolution.ts";
import type { Resolution } from "./closestResolution.ts";

const crfValues: Record<Resolution, number> = {
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
  const targetHeight = closestResolution(videoHeight);

  return crfValues[targetHeight];
}
