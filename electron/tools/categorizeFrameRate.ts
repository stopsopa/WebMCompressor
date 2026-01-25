export default function categorizeFrameRate(frameRate: number) {
  if (frameRate <= 35) {
    return 24;
  }

  return 60;
}
