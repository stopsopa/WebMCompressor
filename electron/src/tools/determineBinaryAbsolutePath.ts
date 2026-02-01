import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Finds the absolute path to the requested binary within the 'bin' directory.
 */
export function determineBinaryAbsolutePath(binaryName: "ffmpeg" | "ffprobe", searchDir?: string): string {
  // If searchDir is not provided, we look for 'bin' two levels up from this tool
  // which matches electron/bin/ when the tool is in electron/src/tools/
  const binDir = searchDir || path.join(__dirname, "..", "..", "bin");

  if (!fs.existsSync(binDir)) {
    throw new Error(`Bin directory not found: ${binDir}`);
  }

  const allFiles: string[] = [];

  // Recursive search to collect all files
  const search = (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        search(fullPath);
      } else {
        allFiles.push(fullPath);
      }
    }
  }; 

  search(binDir);

  if (allFiles.length !== 2) {
    throw new Error(
      `Expected exactly 2 files in ${binDir}, but found ${allFiles.length}: ${JSON.stringify(allFiles.map((p) => path.relative(binDir, p)))}`,
    );
  }

  const requestedPath = allFiles.find((p) => {
    const name = path.basename(p);
    return name === binaryName || name === `${binaryName}.exe`;
  });

  if (!requestedPath) {
    throw new Error(
      `Binary '${binaryName}' not found among the 2 files in ${binDir}. Found: ${JSON.stringify(allFiles.map((p) => path.relative(binDir, p)))}`,
    );
  }

  return path.resolve(requestedPath);
}

// Integration for CI/CD or CLI usage: outputs the path to stdout
const isMain =
  process.argv[1] &&
  (process.argv[1] === __filename ||
    process.argv[1].endsWith("determineBinaryAbsolutePath.ts") ||
    process.argv[1].endsWith("determineBinaryAbsolutePath.js"));

if (isMain) {
  const arg = process.argv[2] as "ffmpeg" | "ffprobe";
  if (arg === "ffmpeg" || arg === "ffprobe") {
    try {
      console.log(determineBinaryAbsolutePath(arg));
    } catch (e: any) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
  } else {
    console.error("Usage: node determineBinaryAbsolutePath.ts [ffmpeg|ffprobe]");
    process.exit(1);
  }
}
