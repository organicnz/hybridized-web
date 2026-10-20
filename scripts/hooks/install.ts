#!/usr/bin/env bun
/**
 * Install the Bun-native git hooks.
 *
 * Points Git's `core.hooksPath` at `.githooks/`, where every hook is a Bun
 * script. This replaces `lefthook`, which was an npm package that downloaded
 * a Go binary at install time and then shelled out to `bun x lefthook` on
 * every hook run — the hooks are now part of the repository and need nothing
 * but Bun.
 *
 * This script is the `prepare` lifecycle hook, so it runs on every
 * `bun install`. It is deliberately a no-op where hooks are meaningless:
 * CI, Vercel and non-git checkouts.
 */
import { existsSync, rmSync } from "bun:fs";
import { join } from "bun:path";
import { makeHooksExecutable, repoRoot } from "./lib";

const HOOKS_DIR = ".githooks";

/**
 * The hooks this project ships.
 *
 * Anything else in `.githooks/` is a leftover — a hook runner's generated
 * script, most often — and Git would run it. The list is what the directory
 * is allowed to contain.
 */
const KNOWN_HOOKS = new Set(["pre-commit", "pre-push"]);

// CI and Vercel check out the repository without ever running a git hook.
if (Bun.env.CI === "1" || Bun.env.VERCEL) {
  process.exit(0);
}

const inside = Bun.spawnSync(["git", "rev-parse", "--is-inside-work-tree"], {
  cwd: repoRoot,
  stdout: "pipe",
  stderr: "ignore",
});

if (inside.exitCode !== 0 || inside.stdout.toString().trim() !== "true") {
  console.log("Not a git repository — skipping hook install.");
  process.exit(0);
}

if (!existsSync(join(repoRoot, HOOKS_DIR))) {
  console.error(`Hook directory ${HOOKS_DIR} is missing — skipping hook install.`);
  process.exit(0);
}

const hooks = makeHooksExecutable();

// Remove anything in the hook directory that this project does not ship. A
// hook runner that used to manage `.githooks/` leaves its own scripts behind,
// and Git would still run them.
const kept: string[] = [];
for (const hook of hooks) {
  if (KNOWN_HOOKS.has(hook)) {
    kept.push(hook);
    continue;
  }
  const path = join(repoRoot, HOOKS_DIR, hook);
  rmSync(path, { force: true });
  console.log(`removed stale hook: ${HOOKS_DIR}/${hook}`);
}

// A relative `core.hooksPath` is resolved against the top level of the
// working tree, so the setting survives a clone into a different directory.
const configured = Bun.spawnSync(["git", "config", "core.hooksPath", HOOKS_DIR], {
  cwd: repoRoot,
  stdout: "pipe",
  stderr: "pipe",
});

if (configured.exitCode !== 0) {
  console.error(`Could not set core.hooksPath: ${configured.stderr.toString().trim()}`);
  process.exit(0);
}

console.log(`sync hooks: ✔️ (${kept.join(", ")})`);
