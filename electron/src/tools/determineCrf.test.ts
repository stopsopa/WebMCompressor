import { describe, it } from "node:test";
import assert from "node:assert";

import determineCrf from "./determineCrf.js";

/**
 * /bin/bash ts.sh --test electron/tools/determineCrf.test.ts
 */
describe("determineCrf", () => {
  it("should return correct crf for 230p", () => {
    assert.strictEqual(determineCrf(230), 37);
  });
  it("should return correct crf for 240p", () => {
    assert.strictEqual(determineCrf(240), 37);
  });
  it("should return correct crf for 360p", () => {
    assert.strictEqual(determineCrf(360), 36);
  });
  it("should return correct crf for 480p", () => {
    assert.strictEqual(determineCrf(480), 33);
  });
  it("should return correct crf for 720p", () => {
    assert.strictEqual(determineCrf(720), 32);
  });
  it("should return correct crf for 721p", () => {
    assert.strictEqual(determineCrf(721), 32);
  });
  it("should return correct crf for 1080p", () => {
    assert.strictEqual(determineCrf(1080), 31);
  });
  it("should return correct crf for 1440p", () => {
    assert.strictEqual(determineCrf(1440), 24);
  });
  it("should return correct crf for 2160p", () => {
    assert.strictEqual(determineCrf(2160), 15);
  });
  it("should return correct crf for 30000p", () => {
    assert.strictEqual(determineCrf(30000), 15);
  });
});
