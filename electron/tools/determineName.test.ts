import { describe, it } from "node:test";
import assert from "node:assert";

import determineName from "./determineName.ts";

/**
 * /bin/bash ts.sh --test electron/tools/determineName.test.ts
 */
describe("determineName", () => {
  it("basic", () => {
    assert.strictEqual(
      determineName("abc/def/file.mov", "webm"),
      "abc/def/file.webm",
    );
  });
});
