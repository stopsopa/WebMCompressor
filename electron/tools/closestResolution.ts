export const heightResolutions = [
  240, 360, 480, 720, 1080, 1440, 2160,
] as const;

export type HeightResolution = (typeof heightResolutions)[number];

export const widthResolutions = [320, 640, 1280, 1920, 2560, 3840] as const;

export type WidthResolution = (typeof widthResolutions)[number];

function find(dimention: number, list: readonly number[]) {
  const closest = list.reduce((a, b) => {
    const c = b - dimention;
    const d = a - dimention;
    const cabs = Math.abs(c);
    const dabs = Math.abs(d);
    const cond = cabs < dabs;
    return cond ? b : a;
  });

  return closest;
}

/**
 * /bin/bash ts.sh --test electron/tools/closestWidth.test.ts
 */
export function closestHeight(videoHeight: number): HeightResolution {
  const height = find(videoHeight, heightResolutions);
  return height as HeightResolution;
}

export function closestWidth(videoWidth: number): WidthResolution {
  const width = find(videoWidth, widthResolutions);
  return width as WidthResolution;
}
