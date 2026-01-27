import { describe, it } from "node:test";
import assert from "node:assert";

import determineTilingAndThreading from "./determineTilingAndThreading.js";


// const tilingAndThreadingMap: Record<
//   WidthResolution,
//   { tileColumns: number; threads: number }
// > = {
//   320: { tileColumns: 0, threads: 1 },
//   640: { tileColumns: 1, threads: 2 },
//   1280: { tileColumns: 2, threads: 4 },
//   1920: { tileColumns: 2, threads: 4 },
//   2560: { tileColumns: 3, threads: 8 },
//   3840: { tileColumns: 3, threads: 8 },
// };

/**
 * /bin/bash ts.sh --test electron/tools/determineTilingAndThreading.test.ts
 */
describe("determineTilingAndThreading", () => {
  it("219p", () => {
    assert.deepStrictEqual(determineTilingAndThreading(239), { tileColumns: 0, threads: 1 });
  });
  it("320", () => {
    assert.deepStrictEqual(determineTilingAndThreading(320), { tileColumns: 0, threads: 1 });
  });
  it("640", () => {
    assert.deepStrictEqual(determineTilingAndThreading(640), { tileColumns: 1, threads: 2 });
  });
  it("1280", () => {
    assert.deepStrictEqual(determineTilingAndThreading(1280), { tileColumns: 2, threads: 4 });
  });
  it("1920", () => {
    assert.deepStrictEqual(determineTilingAndThreading(1920), { tileColumns: 2, threads: 4 });
  });
  it("2560", () => {
    assert.deepStrictEqual(determineTilingAndThreading(2560), { tileColumns: 3, threads: 8 });
  });
  it("3840", () => {
    assert.deepStrictEqual(determineTilingAndThreading(3840), { tileColumns: 3, threads: 8 });
  });
});