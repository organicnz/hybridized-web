#!/usr/bin/env bun
/** Remove the Lefthook git hooks. */
import { $ } from "bun";

console.log("Uninstalling Lefthook git hooks...");

const result = await $`bun x lefthook uninstall`.nothrow();

if (result.exitCode === 0) {
  console.log("✓ Lefthook hooks uninstalled successfully");
} else {
  console.error("✗ Failed to uninstall Lefthook hooks");
}

process.exit(result.exitCode);
