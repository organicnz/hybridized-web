#!/usr/bin/env bun
/**
 * Environment doctor — proves the Bun-first invariants still hold.
 *
 * Run it after any toolchain or dependency change:
 *
 *     bun run doctor
 *
 * Checks:
 *   1. the Bun version pin is stated once and agrees everywhere,
 *   2. the running Bun is the pinned build,
 *   3. no newer canary has been published,
 *   4. no Node.js toolchain is reachable on PATH,
 *   5. bun.lock still satisfies package.json,
 *   6. every declared dependency is present in the lockfile,
 *   7. every package that needs an install script is trusted,
 *   8. bunfig.toml keeps scripts on the Bun runtime and Bun's own shell,
 *   9. no install cache directory was created inside the project,
 *  10. no source file imports a `node:` module,
 *  11. the type gate is `tsrs` and not the `typescript` package,
 *  12. CI never pulls in Node.js and installs the pinned Bun.
 */
import { closeSync, existsSync, openSync, readSync, realpathSync } from "bun:fs";

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

interface BunLock {
  version: string;
  revision: string;
  integrity: Record<string, string>;
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
// The Bun build is pinned once, in `.bun-version`, as the npm publish
// version. Three places must agree:
//   - `.bun-version` — what `scripts/install-bun.ts` installs,
//   - `package.json`'s `packageManager` — what the lockfile layer records,
//   - `.bun-lock.json` — the generated lock (integrity hashes + revision).
//
// `packageManager` alone does NOT pin the runtime: Bun 1.4 never re-execs
// the named build, so the pin is enforced by `scripts/install-bun.ts` and
// checked here instead.

const pinned = (await Bun.file(".bun-version").text()).trim();
const pkg = (await Bun.file("package.json").json()) as PackageJson;
const vercel = (await Bun.file("vercel.json").json()) as VercelConfig;

const manager = pkg.packageManager ?? "";
const managerVersion = manager.startsWith("bun@") ? manager.slice(4) : "";

if (!/^\d+\.\d+\.\d+-canary\./.test(pinned)) {
  fail("Bun version pin is a canary", `.bun-version names "${pinned}"`);
} else if (managerVersion !== pinned) {
  fail(
    "Bun version pin agrees everywhere",
    `package.json packageManager is "bun@${managerVersion}" but .bun-version is "${pinned}"`,
  );
} else {
  const bunLock = (await Bun.file(".bun-lock.json").json()) as BunLock;
  if (bunLock.version !== pinned) {
    fail(
      "Bun version pin agrees everywhere",
      `.bun-lock.json records "${bunLock.version}" but .bun-version is "${pinned}"`,
    );
  } else {
    pass(
      "Bun version pin agrees everywhere",
      `${pinned} in .bun-version, package.json and .bun-lock.json`,
    );
  }
}

// `Bun.version` drops the pre-release tag and `Bun.revision` is a bare
// commit SHA, so ask the CLI for the full string it prints
// (e.g. "1.4.4-canary.1+6bb5dc195").
const fullVersion = Bun.spawnSync([process.execPath, "--revision"], {
  stdout: "pipe",
  stderr: "pipe",
})
  .stdout.toString()
  .trim();

if (!fullVersion.includes("canary")) {
  fail("running Bun is a canary build", `${fullVersion || "(unknown)"} is not a canary`);
} else {
  const bunLock = (await Bun.file(".bun-lock.json").json()) as BunLock;
  if (fullVersion === bunLock.revision) {
    pass("running Bun is the pinned build", fullVersion);
  } else {
    fail(
      "running Bun is the pinned build",
      `running ${fullVersion}, pinned ${bunLock.revision} — run "bun run setup:bun" and put .bun/bin on PATH`,
    );
  }
}

// Vercel pins a range ("1.4.x") and manages patch versions itself.
const vercelVersion = vercel.bunVersion ?? "";
const vercelLine = vercelVersion.replace(/\.x$/, "");
const runtimeLine = releaseLine(Bun.version);
if (vercelLine && releaseLine(vercelLine) === runtimeLine) {
  pass("vercel.json bunVersion", `${vercelVersion} (same ${runtimeLine} line as the runtime)`);
} else {
  fail(
    "vercel.json bunVersion",
    `${vercelVersion || "(unset)"} is outside the ${runtimeLine} line`,
  );
}

// ── 2. A newer canary may be available ───────────────────────────────────────
//
// The npm `canary` dist-tag is the channel the pin tracks. When it moves,
// the local build is stale — worth a nudge, never a failure.

try {
  const registry = (await fetch("https://registry.npmjs.org/bun").then((response) =>
    response.ok ? response.json() : undefined,
  )) as { "dist-tags"?: { canary?: string } } | undefined;
  const latestCanary = registry?.["dist-tags"]?.canary;

  if (!latestCanary) {
    warn("a newer Bun canary is published", "the registry did not report a canary tag");
  } else if (latestCanary === pinned) {
    pass("a newer Bun canary is published", `${pinned} is the latest canary`);
  } else {
    warn(
      "a newer Bun canary is published",
      `${latestCanary} is available (pinned ${pinned}) — bump .bun-version and run "bun run setup:bun"`,
    );
  }
} catch {
  warn("a newer Bun canary is published", "the npm registry could not be reached");
}

// ── 3. No Node.js on PATH ────────────────────────────────────────────────────

/**
 * True when `path` is Bun's own `node` shim, or a script that runs on Bun.
 *
 * While a package.json script runs, Bun puts a `node` symlink to itself on
 * PATH so that third-party install scripts calling `node` still execute on
 * Bun. That is the whole point — but a genuine Node.js install would be a
 * footgun, so the two cases are reported differently.
 *
 * A shim is recognised in either of two ways: it resolves to the running Bun
 * (a symlink), or it is a script whose shebang runs Bun (`#!/usr/bin/env bun`).
 * The second form covers hand-written shims, such as an `npx` that forwards to
 * `bun x` — those carry no Node.js at all and must not be reported.
 */
function isBunShim(path: string): boolean {
  try {
    if (realpathSync(path) === realpathSync(process.execPath)) return true;
  } catch {
    // Not resolvable — fall through to the shebang check.
  }

  try {
    const handle = openSync(path, "r");
    try {
      const buffer = Buffer.alloc(64);
      const read = readSync(handle, buffer, 0, buffer.length, 0);
      const firstLine = buffer.subarray(0, read).toString("utf8").split("\n")[0] ?? "";
      if (!firstLine.startsWith("#!")) return false;
      // The interpreter is the last token of the shebang, e.g.
      // "#!/usr/bin/env bun" or "#!/usr/local/bin/bun".
      const tokens = firstLine
        .replace(/^#!\s*/, "")
        .split(/\s+/)
        .filter(Boolean);
      const interpreter = tokens.at(-1) ?? "";
      return interpreter === "bun" || interpreter.endsWith("/bun");
    } finally {
      closeSync(handle);
    }
  } catch {
    return false;
  }
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
    `node, npm and npx are all Bun shims or absent — nothing runs on Node.js`,
  );
} else {
  warn(
    "no Node.js toolchain on PATH",
    `${realNode.map(([name, path]) => `${name} → ${path}`).join(", ")} — nothing in this project calls them`,
  );
}

// ── 4. Lockfile in sync ──────────────────────────────────────────────────────

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

// ── 5. Every declared dependency is locked ───────────────────────────────────

const lock = Bun.JSONC.parse(await Bun.file("bun.lock").text()) as Lockfile;
const declared = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
const unlocked = declared.filter((name) => !(name in lock.packages));
if (unlocked.length === 0) {
  pass("all declared dependencies are in bun.lock", `${declared.length} dependencies locked`);
} else {
  fail("all declared dependencies are in bun.lock", unlocked.join(", "));
}

// ── 6. Install scripts are trusted ───────────────────────────────────────────

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

// ── 7. bunfig.toml keeps scripts on Bun ──────────────────────────────────────

const bunfig = await Bun.file("bunfig.toml").text();
if (/^\s*bun\s*=\s*true\s*$/m.test(bunfig)) {
  pass("bunfig.toml runs scripts on Bun", "[run] bun = true");
} else {
  fail("bunfig.toml runs scripts on Bun", "[run] bun = true is missing");
}

if (/^\s*shell\s*=\s*"bun"\s*$/m.test(bunfig)) {
  pass("bunfig.toml uses Bun's shell", '[run] shell = "bun"');
} else {
  warn(
    "bunfig.toml uses Bun's shell",
    '[run] shell = "bun" is missing — scripts fall back to the system shell',
  );
}

// The install cache must never be redirected into the project: Bun does not
// expand "~" in a bunfig path, so it would create a literal "~" directory
// here and fill it with the whole cache.
if (/^\s*dir\s*=\s*["'][^"']*~/m.test(bunfig)) {
  fail(
    "bunfig.toml does not redirect the install cache",
    'a cache "dir" containing "~" is set — Bun does not expand it',
  );
} else {
  pass(
    "bunfig.toml does not redirect the install cache",
    "the default ~/.bun/install/cache is used",
  );
}

// ── 8. No install cache inside the project ───────────────────────────────────

if (existsSync("~")) {
  fail(
    "no install cache inside the project",
    'a literal "~" directory exists in the project root — delete it and remove any cache "dir" from bunfig.toml',
  );
} else {
  pass("no install cache inside the project", 'no literal "~" directory');
}

// ── 9. No source file imports a `node:` module ───────────────────────────────
//
// `types/bun-modules.d.ts` is the single exception: it re-exports Node's
// *type* declarations so Bun's own `bun:fs` / `bun:path` specifiers are
// typed. Nothing is imported at runtime.

const nodePrefix = `${"node"}:`;
const nodeImport = new RegExp(`(?:from\\s*|import\\s*\\(|require\\s*\\()\\s*["']${nodePrefix}`);
const nodeImporters: string[] = [];

for (const pattern of [
  "app/**/*.{ts,tsx}",
  "components/**/*.{ts,tsx}",
  "context/**/*.{ts,tsx}",
  "hooks/**/*.{ts,tsx}",
  "lib/**/*.{ts,tsx}",
  "scripts/**/*.{ts,tsx}",
  "tests/**/*.{ts,tsx}",
  "types/**/*.{ts,tsx}",
  "*.{ts,tsx,mjs,js}",
]) {
  for await (const file of new Bun.Glob(pattern).scan({ cwd: "." })) {
    if (file === "types/bun-modules.d.ts") continue;
    if (nodeImport.test(await Bun.file(file).text())) nodeImporters.push(file);
  }
}

if (nodeImporters.length === 0) {
  pass(
    "no source file imports a node: module",
    "only types/bun-modules.d.ts names them, and only as types",
  );
} else {
  fail("no source file imports a node: module", nodeImporters.join(", "));
}

// ── 10. The type gate is tsrs ────────────────────────────────────────────────

const devDependencies = pkg.devDependencies ?? {};
if (devDependencies.tsrs) {
  pass("the type gate is tsrs", `tsrs ${devDependencies.tsrs}`);
} else {
  fail("the type gate is tsrs", "tsrs is not a devDependency");
}

if (!devDependencies.typescript && !pkg.dependencies?.typescript) {
  pass(
    "the typescript package is not installed",
    "TypeScript 7 ships no JS API; tsrs covers the type gate",
  );
} else {
  fail(
    "the typescript package is not installed",
    "the typescript package re-enters a Node.js launcher into the dependency tree",
  );
}

// Next.js resolves `@types/react` and `@types/node` from the project root,
// so `@types/node` has to be a direct dependency rather than a transitive one.
if (devDependencies["@types/node"]) {
  pass("@types/node is a direct dependency", devDependencies["@types/node"]);
} else {
  fail(
    "@types/node is a direct dependency",
    "Next.js requires @types/node; it must not be left to arrive transitively",
  );
}

// ── 11. CI never pulls in Node.js ────────────────────────────────────────────

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

// CI must install the *pinned* Bun, not whatever the canary channel serves
// that day, or local and CI would run different builds.
const installsPinnedBun = await Promise.all(
  workflows.map(async (file) => {
    const text = await Bun.file(file).text();
    return /scripts\/install-bun\.ts/.test(text);
  }),
);

if (workflows.length === 0) {
  warn("CI installs the pinned Bun", "no workflow files found");
} else if (installsPinnedBun.some(Boolean)) {
  pass("CI installs the pinned Bun", "scripts/install-bun.ts runs in CI");
} else {
  fail("CI installs the pinned Bun", "no workflow installs the build pinned by .bun-version");
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

const failures = checks.filter((check) => check.status === "fail");
const warnings = checks.filter((check) => check.status === "warn");
if (failures.length > 0) {
  console.log(`${failures.length} check(s) failed, ${warnings.length} warning(s).`);
  process.exit(1);
}
console.log(`All ${checks.length} checks passed (${warnings.length} warning(s)).`);
