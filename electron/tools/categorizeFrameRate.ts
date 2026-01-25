export const frameRates = [24, 60] as const;

export type FrameRate = (typeof frameRates)[number];

export default function categorizeFrameRate(frameRate: number) {
  if (frameRate <= 35) {
    return 24;
  }

  return 60;
}
