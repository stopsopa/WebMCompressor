import { describe, it } from "node:test";
import assert from "node:assert";
import { spawnSync } from "node:child_process";

import determineName from "./determineName.js";

/**
 * /bin/bash ts.sh --test electron/src/tools/determineName.test.ts
 */
describe("determineName", () => {
  it("basic", () => {
    assert.strictEqual(determineName("abc/def/file.mov", "webm"), "abc/def/file.webm");
  });
  it("equal", () => {
    assert.strictEqual(determineName("abc/def/file.webm", "webm"), "abc/def/file[processed].webm");
  });
  it("cli", () => {
    const result = spawnSync("node", [
      "--experimental-config-file=node.config.json",
      "electron/src/tools/determineName.ts",
      "abc/def/file.mov",
      "webm",
    ]);
    assert.strictEqual(result.stdout.toString().trim(), "abc/def/file.webm");
  });
});
