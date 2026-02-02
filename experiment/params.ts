/**
 * This file demonstrates how to extract parameters from a URL string using
 * TypeScript's Template Literal Types and recursive type inference.
 */

// 1. Split the string into a Union of segments (e.g. "user" | "::userId" | "post")
type GetSegments<T extends string> = T extends `${infer Part}/${infer Rest}` ? Part | GetSegments<Rest> : T;

// 2. Filter union to only include segments starting with '::' and strip the prefix
type ToParamName<T extends string> = T extends `::${infer Name}` ? Name : never;

// 3. Assemble the object using Key Remapping ('as')
type ExtractRouteParams<T extends string> = {
  [K in GetSegments<T> as ToParamName<K>]: string;
};

    // --- EXAMPLES OF HELPER TYPES (Hover over these in your IDE!) --- vvv
        // 1. GetSegments breakdown:
        // It splits the string by '/' and creates a Union of all parts.
        type SegmentsExample = GetSegments<"/user/::userId/post/::postId">;
        // Result: "" | "user" | "::userId" | "post" | "::postId"

        // 2. ToParamName breakdown:
        // It's like a filter. It ignores normal segments and only maps '::' segments to their names.
        type Name1 = ToParamName<"::userId">; // Result: "userId"
        type Name2 = ToParamName<"user">; // Result: never (This tells TypeScript to "skip" this key when mapping)

        // 3. Combining them:
        // GetSegments gives us a list of "candidates".
        // ToParamName filters that list down.
        type ValidNamesExample = ToParamName<GetSegments<"/user/::userId/post/::postId">>;
        // Result: "userId" | "postId"
    // --- EXAMPLES OF HELPER TYPES (Hover over these in your IDE!) --- ^^^

// 2. Demonstration
function defineRoute<Path extends string>(path: Path, handler: (params: ExtractRouteParams<Path>) => void) {
  console.log(`Route defined: ${path}`);
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
});

/**
 * EXPLANATION:
 *
 * 1. Template Literal Types: TypeScript can "look inside" strings if they match a pattern.
 *    `${string}:${infer Param}` allows TS to extract the part after the colon.
 *
 * 2. Recursive Inference: The `ExtractRouteParams` type keeps calling itself
 *    until there are no more segments left in the string.
 *
 * 3. Intersection Types: Using `&` merges the individual parameter objects
 *    (e.g., `{ userId: string } & { postId: string }`) into one final type.
 *
 * HOW TO GOOGLE IT:
 * - "TypeScript Template Literal Types"
 * - "TypeScript Type-level String Manipulation"
 * - "Recursive Template Literal Types"
 * - "Parse string to type TypeScript"
 */
