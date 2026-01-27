export type Scale = {
  width: number;
  height: number;
};

export type TargetScale =
  | { width: number; height?: number }
  | { height: number; width?: number };

export default function scaleWandH(source: Scale, target: TargetScale): Scale {
  const { width: sw, height: sh } = source;

  if (target.height !== undefined) {
    return {
      width: Math.round((target.height / sh) * sw),
      height: target.height,
    };
  }

  if (target.width !== undefined) {
    return {
      width: target.width,
      height: Math.round((target.width / sw) * sh),
    };
  }

  throw new Error(`scaleWandH error: target must have either width or height`);
}
