import { closestWidth } from "./closestResolution.js";
import type { WidthResolution } from "./closestResolution.js";

/**
 * based on: https://developers.google.com/media/vp9/settings/vod/#tiling_and_threading_recommendations
 */
const tilingAndThreadingMap: Record<
  WidthResolution,
  { tileColumns: number; threads: number }
> = {
  320: { tileColumns: 0, threads: 1 },
  640: { tileColumns: 1, threads: 2 },
  1280: { tileColumns: 2, threads: 4 },
  1920: { tileColumns: 2, threads: 4 },
  2560: { tileColumns: 3, threads: 8 },
  3840: { tileColumns: 3, threads: 8 },
};

export default function determineTilingAndThreading(width: number) {
  const targetWidth = closestWidth(width);

  return tilingAndThreadingMap[targetWidth];
}
