#!/usr/bin/env bun
/** Install the Lefthook git hooks. */
import { $ } from "bun";

console.log("Installing Lefthook git hooks...");

const result = await $`bun x lefthook install`.nothrow();

if (result.exitCode === 0) {
  console.log("✓ Lefthook hooks installed successfully");
} else {
  console.error("✗ Failed to install Lefthook hooks");
}

process.exit(result.exitCode);
