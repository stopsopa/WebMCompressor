import { closestHeight } from "./closestResolution.js";
import type { HeightResolution } from "./closestResolution.js";
import type { FrameRate } from "./categorizeFrameRate.js";

export type FrameRateType = `${HeightResolution}:${FrameRate}`;

// Frame Size/Frame Rate	| Target Bitrate (VOD, kbps) |	Min Bitrate (50%)	| Max Bitrate (145%)
// 320x240p   @ 24	| 150	    | 75	    | 218
// 640x360p   @ 24	| 276	    | 138	    | 400
// 640x480p   @ 24	| 750 	  | 375 	  | 1088
// 1280x720p  @ 24	| 1024	  | 512	    | 1485
// 1280x720p  @ 60	| 1800	  | 900	    | 2610
// 1920x1080p @ 24	| 1800	  | 900	    | 2610
// 1920x1080p @ 60	| 3000	  | 1500	  | 4350
// 2560x1440p @ 24	| 6000	  | 3000	  | 8700
// 2560x1440p @ 60	| 9000	  | 4500	  | 13050
// 3840x2160p @ 24	| 12000	  | 6000	  | 17400
// 3840x2160p @ 60	| 18000	  | 9000	  | 26100

/**
 * based on: https://developers.google.com/media/vp9/settings/vod/#bitrate
 */
export const bitrateMap: Record<
  FrameRateType,
  { avg: number; min: number; max: number }
> = {
  // 320x240p   @ 24	| 150	    | 75	    | 218
  "240:24": {
    avg: 150,
    min: 75,
    max: 218,
  },
  "240:60": {
    avg: 150,
    min: 75,
    max: 218,
  },
  // 640x360p   @ 24	| 276	    | 138	    | 400
  "360:24": {
    avg: 276,
    min: 138,
    max: 400,
  },
  "360:60": {
    avg: 276,
    min: 138,
    max: 400,
  },
  // 640x480p   @ 24	| 750 	  | 375 	  | 1088
  "480:24": {
    avg: 750,
    min: 375,
    max: 1088,
  },
  "480:60": {
    avg: 750,
    min: 375,
    max: 1088,
  },
  // 1280x720p  @ 24	| 1024	  | 512	    | 1485
  "720:24": {
    avg: 1024,
    min: 512,
    max: 1485,
  },
  // 1280x720p  @ 60	| 1800	  | 900	    | 2610
  "720:60": {
    avg: 1800,
    min: 900,
    max: 2610,
  },
  // 1920x1080p @ 24	| 1800	  | 900	    | 2610
  "1080:24": {
    avg: 1800,
    min: 900,
    max: 2610,
  },
  // 1920x1080p @ 60	| 3000	  | 1500	  | 4350
  "1080:60": {
    avg: 3000,
    min: 1500,
    max: 4350,
  },
  // 2560x1440p @ 24	| 6000	  | 3000	  | 8700
  "1440:24": {
    avg: 6000,
    min: 3000,
    max: 8700,
  },
  // 2560x1440p @ 60	| 9000	  | 4500	  | 13050
  "1440:60": {
    avg: 9000,
    min: 4500,
    max: 13050,
  },
  // 3840x2160p @ 24	| 12000	  | 6000	  | 17400
  "2160:24": {
    avg: 12000,
    min: 6000,
    max: 17400,
  },
  // 3840x2160p @ 60	| 18000	  | 9000	  | 26100
  "2160:60": {
    avg: 18000,
    min: 9000,
    max: 26100,
  },
};

export default function determineBitrate(
  videoHeight: number,
  frameRate: FrameRate,
) {
  const normalizedHeight = closestHeight(videoHeight);
  return bitrateMap[`${normalizedHeight}:${frameRate}`];
}
