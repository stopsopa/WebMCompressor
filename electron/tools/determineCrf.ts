import closestResolution from "./closestResolution.ts";
import type { Resolution } from "./closestResolution.ts";

// In CQ mode, you will also set the maximum quality level. The following quality levels are recommended for file-based VP9 encoding:

const crfValues: Record<Resolution, number> = {
  240: 37,
  360: 36,
  480: 33,
  720: 32,
  1080: 31,
  1440: 24,
  2160: 15,
};

export default function determineCrf(videoHeight: number): number {
  const targetHeight = closestResolution(videoHeight);

  return crfValues[targetHeight];
}
