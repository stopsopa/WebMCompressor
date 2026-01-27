import { describe, it } from "node:test";
import assert from "node:assert";
import determineBitrate from "./determineBitrate.js";
import { bitrateMap } from "./determineBitrate.js";
import { heightResolutions } from "./closestResolution.js";
import { frameRates } from "./categorizeFrameRate.js";
import type { FrameRateType } from "./determineBitrate.js";

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
