import { compress, decompress } from "./decompress-node.ts";

const originalCode = `/**
 * This file demonstrates how to extract parameters from a URL string using
 * TypeScript's Template Literal Types and recursive type inference.
 */

// 1. Split the string into a Union of segments (e.g. "user" | "::userId" | "post")
type GetSegments<T extends string> = T extends \`\${infer Part}/\${infer Rest}\` ? Part | GetSegments<Rest> : T;

// 2. Filter union to only include segments starting with '::' and strip the prefix
type ToParamName<T extends string> = T extends \`::\${infer Name}\` ? Name : never;

// 3. Assemble the object using Key Remapping ('as')
type ExtractRouteParams<T extends string> = {
  [K in GetSegments<T> as ToParamName<K>]: string;
};

// 2. Demonstration
function defineRoute<Path extends string>(path: Path, handler: (params: ExtractRouteParams<Path>) => void) {
  console.log(\`Route defined: \${path}\`);
}

// usage:
defineRoute("/user/::userId/post/::postId/more/::moreId", (params) => {
  // Hover over 'params' to see its type!
  // It is now a clean object: { userId: string; postId: string; moreId: string; }
  console.log(params.userId);
  console.log(params.postId);
  console.log(params.moreId);

  // params.invalid; // This would be a TypeScript error!
  // console.log(params.invalid);
});`;

console.log("--- LZ-STRING COMPRESSION DEMO ---");
console.log("Original Length:", originalCode.length);

const encoded = compress(originalCode);
console.log("Encoded Length: ", encoded.length);
console.log("Encoded Preview:", encoded.substring(0, 50) + "...");

const decoded = decompress(encoded);
console.log("Decoded successfully?", decoded === originalCode);

if (decoded) {
  console.log("Decoded Content Preview:");
  console.log("------------------------");
  console.log(decoded.substring(0, 150) + "...");
}
