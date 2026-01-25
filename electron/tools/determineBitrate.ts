import { closestHeight } from "./closestResolution.ts";
import type { HeightResolution } from "./closestResolution.ts";

/**
 * based on: https://developers.google.com/media/vp9/settings/vod/#bitrate
 */
const bitrateMap: Record<
  HeightResolution,
  { avg: number; min: number; max: number }
> = {
  240: {
    avg: 150,
    min: 75,
    max: 218,
  },
  360: {
    avg: 276,
    min: 138,
    max: 400,
  },
  480: {
    avg: 750,
    min: 375,
    max: 1088,
  },
  720: {
    avg: 1024,
    min: 512,
    max: 1485,
  },
  1080: {
    avg: 1800,
    min: 900,
    max: 2610,
  },
  1440: {
    avg: 6000,
    min: 3000,
    max: 8700,
  },
  2160: {
    avg: 12000,
    min: 6000,
    max: 17400,
  },
};

export default function determineBitrate(videoHeight: number) {
  const normalizedHeight = closestHeight(videoHeight);
  return bitrateMap[normalizedHeight as keyof typeof bitrateMap];
}
