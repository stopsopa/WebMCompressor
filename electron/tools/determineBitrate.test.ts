import { describe, it } from "node:test";
import assert from "node:assert";
import determineBitrate from "./determineBitrate.ts";

/**
 * /bin/bash ts.sh --test electron/tools/determineBitrate.test.ts
 */
describe("determineBitrate", () => {
  it("should return correct bitrates for 144p", () => {
    assert.deepStrictEqual(determineBitrate(144), {
      avg: 150,
      min: 75,
      max: 218,
    });
  });
  it("should return correct bitrates for 240p", () => {
    assert.deepStrictEqual(determineBitrate(240), {
      avg: 150,
      min: 75,
      max: 218,
    });
  });

  it("should return correct bitrates for 480p", () => {
    assert.deepStrictEqual(determineBitrate(480), {
      avg: 750,
      min: 375,
      max: 1088,
    });
  });

  it("should return correct bitrates for 1080p", () => {
    assert.deepStrictEqual(determineBitrate(1080), {
      avg: 1800,
      min: 900,
      max: 2610,
    });
  });

  it("should return closest resolution bitrates for non-standard height (e.g. 1000p -> 1080p)", () => {
    assert.deepStrictEqual(determineBitrate(1000), {
      avg: 1800,
      min: 900,
      max: 2610,
    });
  });

  it("should return correct bitrates for 2160p", () => {
    assert.deepStrictEqual(determineBitrate(2160), {
      avg: 12000,
      min: 6000,
      max: 17400,
    });
  });
  it("should return correct bitrates for 30000p", () => {
    assert.deepStrictEqual(determineBitrate(30000), {
      avg: 12000,
      min: 6000,
      max: 17400,
    });
  });
});
