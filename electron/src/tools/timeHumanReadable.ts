// Passed: 9.5s (1st: 0.7s) | Total: 14.0s | Remaining: 4.4s
export function timeHumanReadable(ms: number) {
  const totalSeconds = ms / 1000;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  const parts: string[] = [];

  if (h > 0) {
    parts.push(`${h}h`);
  }

  if (m > 0 || h > 0) {
    parts.push(`${m}m`);
  }

  let sStr: string;
  if (ms % 1000 === 0) {
    sStr = Math.floor(s).toString();
  } else {
    sStr = s.toFixed(1);
  }
  parts.push(sStr + "s");

  return parts.join(" ");
}
