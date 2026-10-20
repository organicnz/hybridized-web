/**
 * Ambient declarations for Bun's Node-compatible module aliases.
 *
 * Bun ships `bun:fs` and `bun:path` as runtime-native replacements for
 * `node:fs` / `node:path` (the Node modules are emulated on top of Bun's
 * syscalls). `bun-types` does not declare their types, so without this file
 * the Bun-flavoured import specifiers are untyped and the compiler rejects
 * them.
 *
 * Re-exporting the Node typings keeps `bun:*` imports fully type-safe while
 * the runtime resolution stays on Bun's native implementation.
 *
 * This file is the ONLY place in the project that may name a `node:` module.
 * The references below are type-only — nothing is imported at runtime — and
 * `scripts/doctor.ts` fails if a `node:` specifier appears anywhere else.
 */

declare module "bun:fs" {
  export * from "node:fs";
}

declare module "bun:fs/promises" {
  export * from "node:fs/promises";
}

declare module "bun:path" {
  import path = require("node:path");
  export = path;
}

declare module "bun:path/posix" {
  import posix = require("node:path/posix");
  export = posix;
}

declare module "bun:path/win32" {
  import win32 = require("node:path/win32");
  export = win32;
}
