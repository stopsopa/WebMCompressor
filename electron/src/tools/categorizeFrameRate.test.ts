import { describe, it } from "node:test";
import assert from "node:assert";

import categorizeFrameRate from "./categorizeFrameRate.js";

/**
 * /bin/bash ts.sh --test electron/src/tools/categorizeFrameRate.test.ts
 */
describe("categorizeFrameRate", () => {
  it("basic", () => {
    assert.strictEqual(categorizeFrameRate(24), 24);
    assert.strictEqual(categorizeFrameRate(30), 24);
    assert.strictEqual(categorizeFrameRate(35), 24);
    assert.strictEqual(categorizeFrameRate(36), 60);
    assert.strictEqual(categorizeFrameRate(60), 60);
  });
});
