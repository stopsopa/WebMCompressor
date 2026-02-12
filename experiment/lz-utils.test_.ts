import { describe, it } from "node:test";
import assert from "node:assert";
import { compress, decompress } from "./decompress-node.ts";

/**
 * /bin/bash ts.sh experiment/test-lz-pure.ts
 */
describe("lz-utils testing", () => {
  it("should compress and decompress a standard string", () => {
    const input = "Hello World! 123";
    const encoded = compress(input);
    const decoded = decompress(encoded);
    assert.strictEqual(decoded, input);
  });

  it("should compress and decompress a large string (the demo code)", () => {
    const input = `
      type ExtractRouteParams<T extends string> = {
        [K in GetSegments<T> as ToParamName<K>]: string;
      };
    `.repeat(10);
    const encoded = compress(input);
    const decoded = decompress(encoded);
    assert.strictEqual(decoded, input);
  });

  it("should handle empty strings", () => {
    const emptyEncoded = compress("");
    assert.strictEqual(decompress(emptyEncoded), "");
    assert.strictEqual(decompress(""), "");
  });

  it("should throw for non-string input to compress", () => {
    // @ts-ignore
    assert.throws(() => compress(null), TypeError);
    // @ts-ignore
    assert.throws(() => compress(undefined), TypeError);
    // @ts-ignore
    assert.throws(() => compress(123), TypeError);
  });

  it("should throw for non-string input to decompress", () => {
    // @ts-ignore
    assert.throws(() => decompress(null), TypeError);
    // @ts-ignore
    assert.throws(() => decompress(undefined), TypeError);
    // @ts-ignore
    assert.throws(() => decompress({}), TypeError);
  });

  it("should handle invalid decompression strings gracefully", () => {
    // Garbage input that doesn't follow lz-string URI format
    const decoded = decompress("!!!!!");
    // Usually returns null/empty or sometimes throws depending on the lib version,
    // but we want to make sure it doesn't crash our wrapper.
    assert.ok(decoded === null || typeof decoded === "string");
  });
});
