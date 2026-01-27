import { describe, it } from "node:test";
import assert from "node:assert";
import { timeHumanReadable } from "./timeHumanReadable.js";

/**
 * /bin/bash ts.sh --test electron/tools/timeHumanReadable.test.ts
 */
describe("timeHumanReadable", () => {
  it("under 60 seconds", () => {
    assert.strictEqual(timeHumanReadable(55.6 * 1000), "55.6s");
    assert.strictEqual(timeHumanReadable(55 * 1000), "55s");
    assert.strictEqual(timeHumanReadable(0.5 * 1000), "0.5s");
  });

  it("minutes and seconds", () => {
    assert.strictEqual(timeHumanReadable((5 * 60 + 45.6) * 1000), "5m 45.6s");
    assert.strictEqual(timeHumanReadable((5 * 60 + 45) * 1000), "5m 45s");
    assert.strictEqual(timeHumanReadable(60 * 1000), "1m 0s");
  });

  it("hours, minutes and seconds", () => {
    assert.strictEqual(timeHumanReadable((1 * 3600 + 5 * 60 + 30) * 1000), "1h 5m 30s");
    assert.strictEqual(timeHumanReadable((1 * 3600 + 1) * 1000), "1h 0m 1s");
    assert.strictEqual(timeHumanReadable(1 * 3600 * 1000), "1h 0m 0s");
  });
});
