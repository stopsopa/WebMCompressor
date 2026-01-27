import { describe, it } from "node:test";
import assert from "node:assert";

import generateFFMPEGParams, {
  generateFFMPEGParamsStrings,
} from "./generateFFMPEGParams.js";

/**
 * /bin/bash ts.sh --test electron/tools/generateFFMPEGParams.test.ts
 */
describe("generateFFMPEGParams", () => {
  it("should generate FFMPEG params", () => {
    const { firstPass, secondPass } = generateFFMPEGParamsStrings({
      sourceFile: 'test/dir/test[]\".mp4',
      videoHeight: 1080,
      videoWidth: 1920,
      frameRate: 60,
      scale: true,
      date: "2026-01-25T01:44:58.000Z",
    });
    assert.strictEqual(
      firstPass,
      `-loglevel error -i "test/dir/test[]\\".mp4" -c:v libvpx-vp9 -vf scale=1920x1080 -b:v 3000k -minrate 1500k -maxrate 4350k -tile-columns 2 -threads 4 -g 240 -quality good -crf 31 -speed 4 -an -pass 1 -f null /dev/null`,
    );
    assert.strictEqual(
      secondPass,
      `-loglevel error -progress - -i "test/dir/test[]\\".mp4" -c:v libvpx-vp9 -vf scale=1920x1080 -b:v 3000k -minrate 1500k -maxrate 4350k -tile-columns 2 -threads 4 -g 240 -quality good -crf 31 -speed 2 -c:a libopus -pass 2 -metadata creation_time="2026-01-25T01:44:58.000Z" -metadata comment="sayonara" -y "test/dir/test[]\\".webm"`,
    );
  });

  it("should generate FFMPEG params - extra", () => {
    const { firstPass, secondPass } = generateFFMPEGParamsStrings({
      sourceFile: "test/dir/test.mp4",
      videoHeight: 1080,
      videoWidth: 1920,
      frameRate: 60,
      scale: true,
      date: "2026-01-25T01:44:58.000Z",
      extra: ["-ss", "00:00:17", "-to", "00:00:22"],
    });
    assert.strictEqual(
      firstPass,
      `-loglevel error -i "test/dir/test.mp4" -c:v libvpx-vp9 -vf scale=1920x1080 -b:v 3000k -minrate 1500k -maxrate 4350k -tile-columns 2 -threads 4 -g 240 -quality good -crf 31 -speed 4 -an -ss 00:00:17 -to 00:00:22 -pass 1 -f null /dev/null`,
    );
    assert.strictEqual(
      secondPass,
      `-loglevel error -progress - -i "test/dir/test.mp4" -c:v libvpx-vp9 -vf scale=1920x1080 -b:v 3000k -minrate 1500k -maxrate 4350k -tile-columns 2 -threads 4 -g 240 -quality good -crf 31 -speed 2 -c:a libopus -ss 00:00:17 -to 00:00:22 -pass 2 -metadata creation_time="2026-01-25T01:44:58.000Z" -metadata comment="sayonara" -y "test/dir/test.webm"`,
    );
  });

  it("generateFFMPEGParams", () => {
    const { firstPass, secondPass } = generateFFMPEGParams({
      sourceFile: "test/dir/test.mp4",
      videoHeight: 1080,
      videoWidth: 1920,
      frameRate: 60,
      scale: true,
      date: "2026-01-25T01:44:58.000Z",
    });

    assert.deepStrictEqual(firstPass, [
      ["-loglevel", "error"],
      ["-i", "test/dir/test.mp4"],
      ["-c:v", "libvpx-vp9"],
      ["-vf", "scale=1920x1080"],
      ["-b:v", "3000k", "-minrate", "1500k", "-maxrate", "4350k"],
      ["-tile-columns", "2", "-threads", "4"],
      ["-g", "240"],
      ["-quality", "good"],
      ["-crf", "31"],
      ["-speed", "4"],
      ["-an"],
      ["-pass", "1", "-f", "null", "/dev/null"],
    ]);

    assert.deepStrictEqual(secondPass, [
      ["-loglevel", "error", "-progress", "-"],
      ["-i", "test/dir/test.mp4"],
      ["-c:v", "libvpx-vp9"],
      ["-vf", "scale=1920x1080"],
      ["-b:v", "3000k", "-minrate", "1500k", "-maxrate", "4350k"],
      ["-tile-columns", "2", "-threads", "4"],
      ["-g", "240"],
      ["-quality", "good"],
      ["-crf", "31"],
      ["-speed", "2"],
      ["-c:a", "libopus"],
      [
        "-pass",
        "2",
        "-metadata",
        'creation_time="2026-01-25T01:44:58.000Z"',
        "-metadata",
        'comment="sayonara"',
      ],
      ["-y", "test/dir/test.webm"],
    ]);
  });
});
