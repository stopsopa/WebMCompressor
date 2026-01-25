import { describe, it } from "node:test";
import assert from "node:assert";

import { closestHeight, closestWidth } from "./closestResolution.ts";

/**
 * /bin/bash ts.sh --test electron/tools/closestWidth.test.ts
 */
describe("closestResolution", () => {
  it("heightResolutions", () => {
    assert.strictEqual(closestHeight(30), 240);
    assert.strictEqual(closestHeight(240), 240);
    assert.strictEqual(closestHeight(241), 240);

    assert.strictEqual(closestHeight(359), 360);
    assert.strictEqual(closestHeight(360), 360);
    assert.strictEqual(closestHeight(361), 360);

    assert.strictEqual(closestHeight(478), 480);
    assert.strictEqual(closestHeight(480), 480);
    assert.strictEqual(closestHeight(482), 480);

    assert.strictEqual(closestHeight(720), 720);

    assert.strictEqual(closestHeight(1080), 1080);

    assert.strictEqual(closestHeight(1440), 1440);

    assert.strictEqual(closestHeight(2160), 2160);
    assert.strictEqual(closestHeight(2159), 2160);
    assert.strictEqual(closestHeight(2161), 2160);
    assert.strictEqual(closestHeight(30000), 2160);
  });
});
