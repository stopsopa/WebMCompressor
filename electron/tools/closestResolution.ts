export const resolutions = [240, 360, 480, 720, 1080, 1440, 2160] as const;
export type Resolution = (typeof resolutions)[number];

/** 
 * /bin/bash ts.sh --test electron/tools/closestResolution.test.ts
 */
export default function closestResolution(videoHeight: number): Resolution {
  // create alghoritm to find closest value
  const closest = resolutions.reduce((a, b) => {
    const c = b - videoHeight;
    const d = a - videoHeight;
    const cabs = Math.abs(c);
    const dabs = Math.abs(d);
    const cond = cabs < dabs;
    return cond ? b : a;
  });

  return closest;
}
