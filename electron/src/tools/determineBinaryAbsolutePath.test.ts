import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { determineBinaryAbsolutePath } from "./determineBinaryAbsolutePath.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testBinDir = path.join(__dirname, "test_bin_mock");

/**
 * /bin/bash ts.sh --test electron/src/tools/determineBinaryAbsolutePath.test.ts
 */
describe("determineBinaryAbsolutePath", () => {
  // Helper to clear and setup exactly two files
  const setupFiles = (paths: string[]) => {
    if (fs.existsSync(testBinDir)) {
      fs.rmSync(testBinDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testBinDir, { recursive: true });
    for (const p of paths) {
      const fullDir = path.join(testBinDir, path.dirname(p));
      fs.mkdirSync(fullDir, { recursive: true });
      fs.writeFileSync(path.join(testBinDir, p), "");
    }
  };

  // Clean up
  after(() => {
    if (fs.existsSync(testBinDir)) {
      fs.rmSync(testBinDir, { recursive: true, force: true });
    }
  });

  it("should find ffmpeg in darwin structure when exactly 2 files exist", () => {
    setupFiles(["darwin/arm64/ffmpeg", "darwin/arm64/ffprobe"]);
    const p = determineBinaryAbsolutePath("ffmpeg", testBinDir);
    assert.ok(p.endsWith("darwin/arm64/ffmpeg"));
    assert.ok(path.isAbsolute(p));
  });

  it("should find ffprobe in darwin structure when exactly 2 files exist", () => {
    setupFiles(["darwin/arm64/ffmpeg", "darwin/arm64/ffprobe"]);
    const p = determineBinaryAbsolutePath("ffprobe", testBinDir);
    assert.ok(p.endsWith("darwin/arm64/ffprobe"));
    assert.ok(path.isAbsolute(p));
  });

  it("should find ffmpeg.exe in win32 structure when exactly 2 files exist", () => {
    setupFiles(["win32/x64/ffmpeg.exe", "win32/x64/ffprobe.exe"]);
    const p = determineBinaryAbsolutePath("ffmpeg", testBinDir);
    assert.ok(p.endsWith("win32/x64/ffmpeg.exe"));
    assert.ok(path.isAbsolute(p));
  });

  it("should throw error if more than 2 files exist", () => {
    setupFiles(["darwin/arm64/ffmpeg", "darwin/arm64/ffprobe", "extra.txt"]);
    assert.throws(() => {
      determineBinaryAbsolutePath("ffmpeg", testBinDir);
    }, /Expected exactly 2 files/);
  });

  it("should throw error if fewer than 2 files exist", () => {
    setupFiles(["darwin/arm64/ffmpeg"]);
    assert.throws(() => {
      determineBinaryAbsolutePath("ffmpeg", testBinDir);
    }, /Expected exactly 2 files/);
  });

  it("should throw error if bin directory is missing", () => {
    const nonExistent = path.join(__dirname, "non_existent_dir_random");
    assert.throws(() => {
      determineBinaryAbsolutePath("ffmpeg", nonExistent);
    }, /Bin directory not found/);
  });

  it("should throw error if exactly 2 files exist but neither is the requested binary", () => {
    setupFiles(["other1.txt", "other2.txt"]);
    assert.throws(() => {
      determineBinaryAbsolutePath("ffmpeg", testBinDir);
    }, /Binary 'ffmpeg' not found among the 2 files/);
  });
});
