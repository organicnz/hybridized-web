#!/usr/bin/env bun
/**
 * Run a Lefthook hook manually.
 *
 * Usage: bun scripts/lefthook/run.ts [hook-name]   (default: pre-commit)
 */
import { $ } from "bun";

const hookName = Bun.argv[2] ?? "pre-commit";

console.log(`Running Lefthook hook: ${hookName}`);

const result = await $`bun x lefthook run ${hookName}`.nothrow();

if (result.exitCode === 0) {
  console.log(`✓ Hook ${hookName} completed successfully`);
} else {
  console.error(`✗ Hook ${hookName} failed`);
}

process.exit(result.exitCode);
