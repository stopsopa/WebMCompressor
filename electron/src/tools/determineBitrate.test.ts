import { describe, it } from "node:test";
import assert from "node:assert";
import determineBitrate from "./determineBitrate.ts";
import { bitrateMap } from "./determineBitrate.ts";
import { heightResolutions } from "./closestResolution.ts";
import { frameRates } from "./categorizeFrameRate.ts";
import type { FrameRateType } from "./determineBitrate.ts";

/**
 * /bin/bash ts.sh --test electron/tools/determineBitrate.test.ts
 */
describe("determineBitrate", () => {
  for (const h of heightResolutions) {
    for (const r of frameRates) {
      const key = `${h}:${r}` as FrameRateType;
      it(key, () => {
        const value = bitrateMap[key];

        console.log(`key >${key}< value >${JSON.stringify(value)}<`);

        assert.deepStrictEqual(determineBitrate(h, r), value);
      });
    }
  }
});
