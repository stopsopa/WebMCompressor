import closestResolution from "./closestResolution.ts";

/**
 * Values based on: https://developers.google.com/media/vp9/settings/vod/#bitrate
 *
 * "The following bitrates are suggested as baselines for web and mobile distribution.
 * These suggestions minimize bitrate which achieving video quality suitable for consumer
 * web and mobile distribution; think of them as a 'low' bit rate recommendation that
 * can still achieve reasonable quality."
 *
 * "For the examples above, it is recommended that minimum bitrate be set at 50% of
 * target bitrate, and maximum at 145% of target."
 */
const bitrateMap = {
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
  const normalizedHeight = closestResolution(videoHeight);
  return bitrateMap[normalizedHeight as keyof typeof bitrateMap];
}
