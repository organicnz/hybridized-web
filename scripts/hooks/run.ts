#!/usr/bin/env bun
/**
 * Run a git hook manually.
 *
 * Usage: bun scripts/hooks/run.ts [hook-name]   (default: pre-commit)
 *
 * The same entry point Git uses, so a hook can be reproduced without
 * staging anything.
 */
import { existsSync } from "bun:fs";
import { join } from "bun:path";
import { repoRoot } from "./lib";

const hookName = Bun.argv[2] ?? "pre-commit";
const hookPath = join(repoRoot, ".githooks", hookName);

if (!existsSync(hookPath)) {
  console.error(`No such hook: .githooks/${hookName}`);
  process.exit(1);
}

console.log(`Running hook: ${hookName}`);

const result = Bun.spawnSync([process.execPath, hookPath], {
  cwd: repoRoot,
  stdio: ["inherit", "inherit", "inherit"],
});

process.exit(result.exitCode);
