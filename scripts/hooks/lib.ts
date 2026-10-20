#!/usr/bin/env bun
/**
 * Shared helpers for the Bun-native git hooks.
 *
 * Git executes the files in `.githooks/` directly, so they need a small
 * amount of glue: run a gate, report it, and stop at the first failure.
 *
 * Everything here runs on Bun. There is no Node.js in the hook path.
 */
import { chmodSync, existsSync, readdirSync } from "bun:fs";
import { join } from "bun:path";

/** The Bun binary running this hook — every child process uses the same one. */
export const bun = process.execPath;

/** The repository root, resolved from this file rather than the cwd. */
export const repoRoot = join(import.meta.dir, "..", "..");

/**
 * Run one gate and report the outcome.
 *
 * The command is spawned directly (no shell), so nothing is re-parsed and no
 * argument can be reinterpreted. The child's output is inherited, so the
 * developer sees exactly what the gate printed.
 *
 * @returns `true` when the command exited cleanly.
 */
export function gate(label: string, command: string[]): boolean {
  console.log(`\n▸ ${label}`);
  const result = Bun.spawnSync(command, {
    cwd: repoRoot,
    stdio: ["inherit", "inherit", "inherit"],
  });

  if (result.exitCode === 0) {
    console.log(`  ✓ ${label}`);
    return true;
  }

  console.error(`  ✗ ${label} (exit code ${result.exitCode})`);
  return false;
}

/**
 * The paths staged for the next commit.
 *
 * `ACMR` keeps added, copied, modified and renamed files and drops deleted
 * ones — a deleted path has nothing left to check. NUL separation is used so
 * a file name containing a space or a quote survives intact.
 */
export function stagedFiles(): string[] {
  const result = Bun.spawnSync(
    ["git", "diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"],
    { cwd: repoRoot, stdout: "pipe" },
  );

  if (result.exitCode !== 0) return [];

  return result.stdout
    .toString()
    .split("\0")
    .map((file) => file.trim())
    .filter(Boolean);
}

/** Re-stage files after a formatter rewrote them. */
export function restage(files: string[]): void {
  if (files.length === 0) return;
  Bun.spawnSync(["git", "add", "--", ...files], {
    cwd: repoRoot,
    stdio: ["inherit", "inherit", "inherit"],
  });
}

/** The hook files in `.githooks/`, made executable. */
export function makeHooksExecutable(): string[] {
  const hooksDir = join(repoRoot, ".githooks");
  if (!existsSync(hooksDir)) return [];

  const hooks: string[] = [];
  for (const entry of readdirSync(hooksDir)) {
    if (entry.startsWith(".")) continue;
    const path = join(hooksDir, entry);
    chmodSync(path, 0o755);
    hooks.push(entry);
  }
  return hooks.sort();
}
