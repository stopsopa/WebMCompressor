import test, { describe } from "node:test";
import assert from "node:assert";
import scaleWandH from "./scaleWandH.js";

/**
 * /bin/bash ts.sh --test electron/tools/scaleWandH.test.ts
 */
describe("scaleWandH", () => {
  test("should scale based on width only", () => {
    const source = { width: 1920, height: 1080 };
    const target = { width: 1280 };
    const result = scaleWandH(source, target);
    assert.deepStrictEqual(result, { width: 1280, height: 720 });
    assert.strictEqual(
      (source.width / source.height).toFixed(4),
      (result.width / result.height).toFixed(4),
    );
  });

  test("should scale based on height only", () => {
    const source = { width: 1920, height: 1080 };
    const target = { height: 720 };
    const result = scaleWandH(source, target);
    assert.deepStrictEqual(result, { width: 1280, height: 720 });
    assert.strictEqual(
      (source.width / source.height).toFixed(4),
      (result.width / result.height).toFixed(4),
    );
  });

  test("should scale up based on width", () => {
    const source = { width: 100, height: 100 };
    const target = { width: 200 };
    const result = scaleWandH(source, target);
    assert.deepStrictEqual(result, { width: 200, height: 200 });
    assert.strictEqual(
      (source.width / source.height).toFixed(4),
      (result.width / result.height).toFixed(4),
    );
  });

  test("should throw error if neither width nor height is provided", () => {
    const source = { width: 100, height: 100 };
    const target = {} as any;
    assert.throws(() => {
      scaleWandH(source, target);
    }, /scaleWandH error: target must have either width or height/);
  });
});
