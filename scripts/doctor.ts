#!/usr/bin/env bun
/**
 * Environment doctor — proves the Bun-first invariants still hold.
 *
 * Run it after any toolchain or dependency change:
 *
 *     bun run doctor
 *
 * Checks:
 *   1. the running Bun matches every version declaration,
 *   2. no Node.js toolchain is reachable on PATH,
 *   3. bun.lock still satisfies package.json,
 *   4. every declared dependency is present in the lockfile,
 *   5. every package that needs an install script is trusted,
 *   6. bunfig.toml keeps scripts on the Bun runtime and Bun's own shell,
 *   7. CI never pulls in Node.js.
 */
import { realpathSync } from "bun:fs";

type Status = "ok" | "warn" | "fail";

interface Check {
  name: string;
  status: Status;
  detail: string;
}

interface PackageJson {
  packageManager?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  trustedDependencies?: string[];
}

interface VercelConfig {
  bunVersion?: string;
}

interface Lockfile {
  packages: Record<string, unknown>;
  trustedDependencies?: string[];
}

const checks: Check[] = [];
const pass = (name: string, detail: string) => void checks.push({ name, status: "ok", detail });
const warn = (name: string, detail: string) => void checks.push({ name, status: "warn", detail });
const fail = (name: string, detail: string) => void checks.push({ name, status: "fail", detail });

/** The `major.minor` line a version belongs to, ignoring pre-release tags. */
function releaseLine(version: string): string {
  return version.split(".").slice(0, 2).join(".");
}

// ── 1. Version pin ───────────────────────────────────────────────────────────
//
// The project tracks the Bun *canary* channel:
//   - `.bun-version` is the channel mise resolves locally ("latest"),
//   - `package.json` pins the exact npm canary so CI is reproducible,
//   - `vercel.json` can only name a release line ("1.4.x"); Vercel manages
//     the patch versions itself.

const pinned = (await Bun.file(".bun-version").text()).trim();
const pkg = (await Bun.file("package.json").json()) as PackageJson;
const vercel = (await Bun.file("vercel.json").json()) as VercelConfig;

const manager = pkg.packageManager ?? "";
if (/^bun@\d+\.\d+\.\d+-canary\./.test(manager)) {
  pass("package.json packageManager pins a Bun canary", manager);
} else {
  fail(
    "package.json packageManager pins a Bun canary",
    `${manager || "(unset)"} is not a bun@<version>-canary.<date> specifier`,
  );
}

// `Bun.version` drops the pre-release tag and `Bun.revision` is a bare
// commit SHA, so ask the CLI for the full string it prints
// (e.g. "1.4.4-canary.1+6bb5dc195").
const fullVersion = Bun.spawnSync([process.execPath, "--revision"], {
  stdout: "pipe",
  stderr: "pipe",
}).stdout.toString().trim();

if (fullVersion.includes("canary")) {
  pass("running Bun is a canary build", fullVersion);
} else {
  fail("running Bun is a canary build", `${fullVersion || "(unknown)"} is not a canary`);
}

if (pinned === "latest" || /-canary\./.test(pinned)) {
  pass(".bun-version tracks the canary channel", pinned);
} else {
  warn(".bun-version tracks the canary channel", `pinned to ${pinned} instead of a channel`);
}

// Vercel pins a range ("1.4.x") and manages patch versions itself.
const vercelVersion = vercel.bunVersion ?? "";
const vercelLine = vercelVersion.replace(/\.x$/, "");
const runtimeLine = releaseLine(Bun.version);
if (vercelLine && releaseLine(vercelLine) === runtimeLine) {
  pass("vercel.json bunVersion", `${vercelVersion} (same ${runtimeLine} line as the runtime)`);
} else {
  fail("vercel.json bunVersion", `${vercelVersion || "(unset)"} is outside the ${runtimeLine} line`);
}

// ── 2. No Node.js on PATH ────────────────────────────────────────────────────

/**
 * True when `path` is Bun's own `node` shim.
 *
 * While a package.json script runs, Bun puts a `node` symlink to itself on
 * PATH so that third-party install scripts calling `node` still execute on
 * Bun. That is the whole point — but a genuine Node.js install would be a
 * footgun, so the two cases are reported differently.
 */
function isBunShim(path: string): boolean {
  try {
    if (realpathSync(path) === realpathSync(process.execPath)) return true;
  } catch {
    /* fall through to the version probe */
  }
  // Bun also installs its own `npx`/`npm` compatibility shims, which report
  // Bun's version rather than Node's.
  const probe = Bun.spawnSync([path, "--version"], { stdout: "pipe", stderr: "pipe" });
  const version = probe.stdout.toString().trim();
  return version.startsWith("v") === false && version.length > 0;
}

const nodeish = ["node", "npm", "npx"]
  .map((name) => [name, Bun.which(name)] as const)
  .filter((entry): entry is readonly [string, string] => Boolean(entry[1]));

const realNode = nodeish.filter(([, path]) => !isBunShim(path));

if (nodeish.length === 0) {
  pass("no Node.js toolchain on PATH", "node, npm and npx are all absent");
} else if (realNode.length === 0) {
  pass(
    "no Node.js toolchain on PATH",
    `${nodeish.map(([name]) => name).join(", ")} resolve to Bun's own shims — nothing runs on Node.js`,
  );
} else {
  warn(
    "no Node.js toolchain on PATH",
    `${realNode.map(([name, path]) => `${name} → ${path}`).join(", ")} — nothing in this project calls them`,
  );
}

// ── 3. Lockfile in sync ──────────────────────────────────────────────────────

const install = Bun.spawnSync(["bun", "install", "--frozen-lockfile", "--dry-run"], {
  stdout: "pipe",
  stderr: "pipe",
});
if (install.exitCode === 0) {
  pass("bun.lock satisfies package.json", "bun install --frozen-lockfile succeeds");
} else {
  const message = install.stderr.toString().trim().split("\n").slice(0, 2).join(" ");
  fail("bun.lock satisfies package.json", message || "bun install --frozen-lockfile failed");
}

// ── 4. Every declared dependency is locked ───────────────────────────────────

const lock = Bun.JSONC.parse(await Bun.file("bun.lock").text()) as Lockfile;
const declared = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
const unlocked = declared.filter((name) => !(name in lock.packages));
if (unlocked.length === 0) {
  pass("all declared dependencies are in bun.lock", `${declared.length} dependencies locked`);
} else {
  fail("all declared dependencies are in bun.lock", unlocked.join(", "));
}

// ── 5. Install scripts are trusted ───────────────────────────────────────────

const trusted = new Set(pkg.trustedDependencies ?? []);
const needingTrust = new Set<string>();

// Bun.Glob has no brace expansion, so scoped and unscoped manifests need
// their own pattern.
for (const pattern of ["node_modules/*/package.json", "node_modules/@*/*/package.json"]) {
  for await (const file of new Bun.Glob(pattern).scan({ cwd: "." })) {
    const manifest = (await Bun.file(file).json()) as {
      name?: string;
      scripts?: Record<string, string>;
    };
    const scripts = manifest.scripts ?? {};
    if (scripts.install || scripts.postinstall || scripts.preinstall) {
      needingTrust.add(manifest.name ?? file);
    }
  }
}

const untrusted = [...needingTrust].filter((name) => !trusted.has(name)).sort();
if (untrusted.length === 0) {
  pass("install scripts are trusted", `${needingTrust.size} packages need scripts, all trusted`);
} else {
  fail(
    "install scripts are trusted",
    `${untrusted.join(", ")} — Bun blocks these; add them to trustedDependencies`,
  );
}

// ── 6. bunfig.toml keeps scripts on Bun ──────────────────────────────────────

const bunfig = await Bun.file("bunfig.toml").text();
if (/^\s*bun\s*=\s*true\s*$/m.test(bunfig)) {
  pass("bunfig.toml runs scripts on Bun", "[run] bun = true");
} else {
  fail("bunfig.toml runs scripts on Bun", "[run] bun = true is missing");
}

if (/^\s*shell\s*=\s*"bun"\s*$/m.test(bunfig)) {
  pass("bunfig.toml uses Bun's shell", '[run] shell = "bun"');
} else {
  warn("bunfig.toml uses Bun's shell", '[run] shell = "bun" is missing — scripts fall back to the system shell');
}

// ── 7. CI never pulls in Node.js ─────────────────────────────────────────────

const workflows: string[] = [];
for (const pattern of [".github/workflows/*.yml", ".github/workflows/*.yaml"]) {
  for await (const file of new Bun.Glob(pattern).scan({ cwd: "." })) {
    workflows.push(file);
  }
}

const nodeStepping = [];
for (const file of workflows) {
  // Match the `uses:` directive, not prose that merely mentions the action.
  if (/uses:\s*actions\/setup-node/.test(await Bun.file(file).text())) nodeStepping.push(file);
}

if (workflows.length === 0) {
  warn("CI never pulls in Node.js", "no workflow files found");
} else if (nodeStepping.length === 0) {
  pass("CI never pulls in Node.js", `${workflows.length} workflow(s), no setup-node`);
} else {
  fail("CI never pulls in Node.js", `setup-node in ${nodeStepping.join(", ")}`);
}

// ── Report ───────────────────────────────────────────────────────────────────

const icon: Record<Status, string> = { ok: "✓", warn: "!", fail: "✗" };
const width = Math.max(...checks.map((check) => check.name.length));

console.log("Bun environment doctor");
console.log("─".repeat(width + 40));
for (const check of checks) {
  console.log(`${icon[check.status]} ${check.name.padEnd(width)}  ${check.detail}`);
}
console.log("─".repeat(width + 40));

const failures = checks.filter((check) => check.status === "fail").length;
const warnings = checks.filter((check) => check.status === "warn").length;

if (failures > 0) {
  console.error(`${failures} check(s) failed, ${warnings} warning(s).`);
  process.exit(1);
}

console.log(`All ${checks.length} checks passed${warnings > 0 ? ` (${warnings} warning(s))` : ""}.`);
