import { describe, it } from "node:test";
import assert from "node:assert";
import determineMultipassSpeed from "./determineMultipassSpeed.js";

/**
 * /bin/bash ts.sh --test electron/tools/determineMultipassSpeed.test.ts
 */
describe("determineMultipassSpeed", () => {
  it("should return the correct speed for 239p", () => {
    assert.deepStrictEqual(determineMultipassSpeed(239), { firstPass: 4, secondPass: 1 });
  });
  it("should return the correct speed for 240p", () => {
    assert.deepStrictEqual(determineMultipassSpeed(240), { firstPass: 4, secondPass: 1 });
  });

  it("should return the correct speed for 360p", () => {
    assert.deepStrictEqual(determineMultipassSpeed(360), { firstPass: 4, secondPass: 1 });
  });

  it("should return the correct speed for 480p", () => {
    assert.deepStrictEqual(determineMultipassSpeed(480), { firstPass: 4, secondPass: 1 });
  });

  it("should return the correct speed for 720p", () => {
    assert.deepStrictEqual(determineMultipassSpeed(720), { firstPass: 4, secondPass: 2 });
  });

  it("should return the correct speed for 1080p", () => {
    assert.deepStrictEqual(determineMultipassSpeed(1080), { firstPass: 4, secondPass: 2 });
  });

  it("should return the correct speed for 1440p", () => {
    assert.deepStrictEqual(determineMultipassSpeed(1440), { firstPass: 4, secondPass: 2 });
  });

  it("should return the correct speed for 2160p", () => {
    assert.deepStrictEqual(determineMultipassSpeed(2160), { firstPass: 4, secondPass: 2 });
  });
  it("should return the correct speed for 3000p", () => {
    assert.deepStrictEqual(determineMultipassSpeed(3000), { firstPass: 4, secondPass: 2 });
  });
});
