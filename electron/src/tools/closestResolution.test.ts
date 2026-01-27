import { describe, it } from "node:test";
import assert from "node:assert";

import { closestHeight, closestWidth } from "./closestResolution.js";

/**
 * /bin/bash ts.sh --test electron/tools/closestResolution.test.ts
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

  it("widthResolutions", () => {
    assert.strictEqual(closestWidth(241), 320);

    assert.strictEqual(closestWidth(359), 320);
    assert.strictEqual(closestWidth(360), 320);
    assert.strictEqual(closestWidth(361), 320);

    assert.strictEqual(closestWidth(482), 640);


    assert.strictEqual(closestWidth(1080), 1280);

    assert.strictEqual(closestWidth(1919), 1920);
    assert.strictEqual(closestWidth(1920), 1920);
    assert.strictEqual(closestWidth(1921), 1920);

    assert.strictEqual(closestWidth(2560), 2560);

    assert.strictEqual(closestWidth(2560), 2560);

    assert.strictEqual(closestWidth(3839), 3840);
    assert.strictEqual(closestWidth(3840), 3840);
    assert.strictEqual(closestWidth(3849), 3840);
  });
});
