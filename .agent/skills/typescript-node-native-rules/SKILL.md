---
name: typescript-node-native-rules
description: Coding style for typescript code used in this project. with native --experimental-strip-types & --experimental‑transform‑types
---

# Current state of the art:

```

// --experimental-strip-types timeline
    // Initially was introduced in v22.6.0
    //   https://github.com/nodejs/node/releases/tag/v22.6.0
    //
    // First time enabled by default (Current version) - Jan 7, 2025
    //   https://github.com/nodejs/node/releases/tag/v23.6.0
    //
    // Node.js v22.18.0 (LTS), type stripping was enabled by default was backported to LTS - Jul 31, 2025
    //   (UNFLAGGED - made the default behavior) (so the flag is no longer required to strip types).
    //   https://github.com/nodejs/node/releases/tag/v22.18.0
    //
    // Typescript support in node is stable since 25.2.0
    //     https://nodejs.org/en/blog/release/v25.2.0
    //     https://github.com/nodejs/node/releases/tag/v25.2.0\
    //       The "Stability" (Warning Removed)
    //
    // For Full TypeScript support still use tsx: https://nodejs.org/api/typescript.html#full-typescript-support
    //
    // For Type Stripping: https://nodejs.org/api/typescript.html#type-stripping
    //   More details about stripping: https://nodejs.org/api/typescript.html#typescript-features
    //   Node.js does not read tsconfig.json files and does not support features that depend on settings within tsconfig.json, such as paths or converting newer JavaScript syntax into older standards.
    //   adding `import type` is needed: https://nodejs.org/api/typescript.html#importing-types-without-type-keyword
    //     use verbatimModuleSyntax to match this behaviour: https://www.typescriptlang.org/tsconfig/#verbatimModuleSyntax
    //   Node.js does not generate them. When --experimental-transform-types is enabled, source-maps are enabled by default.
    //     from: https://nodejs.org/api/typescript.html#source-maps
    //   To discourage package authors from publishing packages written in TypeScript, Node.js refuses to handle TypeScript files inside folders under a node_modules path.
    //   Paths aliases - not supported: https://nodejs.org/api/typescript.html#paths-aliases

// --experimental-strip-types has little different timeline
    // flag introduced in https://github.com/nodejs/node/releases/tag/v22.7.0
    //   without this flag ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX will be thrown when enums, namespaces, parameter properties used
    // as of January 2026 still stays opt-in, so still experminental. Researching Stability
    //
    // TIP: if you want to avoid using this flag, use erasableSyntaxOnly: true in tsconfig
    //      https://www.typescriptlang.org/tsconfig/#erasableSyntaxOnly
    // LONG STORY SHORT (as of 21 Jan 2026) still use --experimental‑transform‑types and it is (semi) safe to use since LTS v22.18.0


```

# guide - this project expectations

First of all we are using node specified in .tool-versions file.
That version of node supports --experimental-strip-types. It's above v22.18.0.
I would like to use that version to run typescript code without using tsc.

But we will still use tsc for validation of types.

From 'state of the art' above we will still have to use flag --experimental-transform-types every time we attempt to execute typescript code. with node \*.ts.
Ideally we should inject this flag via NODE_OPTIONS in .env.sh to keep our shell scripts and package.json clean.

We will relay on --experimental-transform-types so don't add flag erasableSyntaxOnly to tsconfig

We will use flag "noEmit": true as mentioned in https://nodejs.org/api/typescript.html#type-stripping - since we will attempt to not generate with typescript compiler but just validate/check types.
