import { describe, it } from "node:test";
import assert from "node:assert";

import closestResolution from "./closestResolution.ts";

describe("closestResolution", () => {
  it("should return closest resolution", () => {
    assert.strictEqual(closestResolution(30), 240);
    assert.strictEqual(closestResolution(240), 240);
    assert.strictEqual(closestResolution(241), 240);

    assert.strictEqual(closestResolution(359), 360);
    assert.strictEqual(closestResolution(360), 360);
    assert.strictEqual(closestResolution(361), 360);

    assert.strictEqual(closestResolution(478), 480);
    assert.strictEqual(closestResolution(480), 480);
    assert.strictEqual(closestResolution(482), 480);

    assert.strictEqual(closestResolution(720), 720);

    assert.strictEqual(closestResolution(1080), 1080);

    assert.strictEqual(closestResolution(1440), 1440);

    assert.strictEqual(closestResolution(2160), 2160);
    assert.strictEqual(closestResolution(2159), 2160);
    assert.strictEqual(closestResolution(2161), 2160);
    assert.strictEqual(closestResolution(30000), 2160);
  });
});
