#!/usr/bin/env bun
/**
 * `prepare` lifecycle hook — runs automatically on `bun install`.
 *
 * Installs the Lefthook git hooks, but only where that is meaningful:
 * CI, Vercel and non-git checkouts have no hooks to install into, so we exit
 * early and keep `bun install` fast and side-effect free.
 */
import { $ } from "bun";

if (Bun.env.CI === "1" || Bun.env.VERCEL) {
  process.exit(0);
}

const workTree = await $`git rev-parse --is-inside-work-tree`.quiet().nothrow();
if (workTree.exitCode !== 0) {
  console.log("Not a git repository — skipping lefthook install.");
  process.exit(0);
}

const result = await $`bun x lefthook install`.nothrow();
process.exit(result.exitCode);
