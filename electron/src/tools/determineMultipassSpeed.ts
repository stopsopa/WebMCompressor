import { closestHeight } from "./closestResolution.js";
import type { HeightResolution } from "./closestResolution.js";

const crfValues: Record<
  HeightResolution,
  { firstPass: number; secondPass: number }
> = {
  240: {
    firstPass: 4,
    secondPass: 1,
  },
  360: {
    firstPass: 4,
    secondPass: 1,
  },
  480: {
    firstPass: 4,
    secondPass: 1,
  },
  720: {
    firstPass: 4,
    secondPass: 2,
  },
  1080: {
    firstPass: 4,
    secondPass: 2,
  },
  1440: {
    firstPass: 4,
    secondPass: 2,
  },
  2160: {
    firstPass: 4,
    secondPass: 2,
  },
};

/**
 * based on: https://developers.google.com/media/vp9/settings/vod/#multi-pass_encoding_and_encoding_speed
 */
export default function determineMultipassSpeed(videoHeight: number) {
  const targetHeight = closestHeight(videoHeight);

  return crfValues[targetHeight];
}
