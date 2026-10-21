#!/usr/bin/env bun
/**
 * Environment doctor — proves the Bun-first invariants still hold.
 *
 * Run it after any toolchain or dependency change:
 *
 *     bun run doctor
 *
 * Checks:
 *   1.  the Bun version pin is stated once and agrees everywhere,
 *   2.  the running Bun is the pinned build,
 *   3.  no newer canary has been published,
 *   4.  no Node.js toolchain is reachable on PATH,
 *   5.  bun.lock still satisfies package.json,
 *   6.  every declared dependency is present in the lockfile,
 *   7.  every package that needs an install script is trusted,
 *   8.  bunfig.toml keeps scripts on the Bun runtime and Bun's own shell,
 *   9.  no install cache directory was created inside the project,
 *   10. bunfig.toml uses the isolated linker and the supply-chain guard,
 *   11. no source file imports a `node:` module,
 *   12. `@types/node` is a direct dependency and nothing else Node.js is,
 *   13. the type gate is `tsrs` and not the `typescript` package,
 *   14. CI never pulls in Node.js and installs the pinned Bun,
 *   15. the git hooks are Bun scripts, not a Node.js tool.
 */
import { closeSync, existsSync, openSync, readSync, readlinkSync, realpathSync } from "bun:fs";
import { dirname, join } from "bun:path";
import { findSecrets, findSecretsInHistory, type SecretFinding } from "./lib/secrets";

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
  scripts?: Record<string, string>;
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
// `packageManager` alone does NOT pin the runtime: Bun 1.4 never re-execs the
// named build, so the pin is enforced by `scripts/install-bun.ts` and
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
 * A shim is recognised in either of three ways:
 *
 *   1. it resolves to the running Bun (a symlink),
 *   2. it is a symlink to a Bun binary — which is what the temporary shim
 *      Bun puts on PATH is. It points at a Bun install, but not necessarily
 *      the one running, so the symlink target is not enough on its own.
 *      It cannot be asked what it is either: invoked as `node`, Bun enters
 *      Node-compatibility mode, where `--revision` does not exist.
 *   3. it is a script whose shebang runs Bun (`#!/usr/bin/env bun`), which
 *      covers hand-written shims such as an `npx` that forwards to `bun x`.
 */
function isBunShim(path: string): boolean {
  try {
    if (realpathSync(path) === realpathSync(process.execPath)) return true;
  } catch {
    // Not resolvable — fall through to the next check.
  }

  try {
    const target = readlinkSync(path).split("/").pop() ?? "";
    if (target === "bun" || target === "bun.exe") return true;
  } catch {
    // Not a symlink — fall through to the shebang check.
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

// Always the running Bun, whatever is on PATH.
const install = Bun.spawnSync([process.execPath, "install", "--frozen-lockfile", "--dry-run"], {
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

// The isolated linker puts every package in `node_modules/.bun/<pkg>@<ver>/`,
// so the store has to be scanned as well as the project root. Bun.Glob has no
// brace expansion, so scoped and unscoped manifests need their own pattern.
const manifestPatterns = [
  "node_modules/*/package.json",
  "node_modules/@*/*/package.json",
  "node_modules/.bun/*/node_modules/*/package.json",
  "node_modules/.bun/*/node_modules/@*/*/package.json",
];

for (const pattern of manifestPatterns) {
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

// ── 9. The install is isolated and supply-chain guarded ──────────────────────

if (/^\s*linker\s*=\s*"isolated"\s*$/m.test(bunfig)) {
  pass("bunfig.toml uses the isolated linker", '[install] linker = "isolated"');
} else {
  fail(
    "bunfig.toml uses the isolated linker",
    '[install] linker = "isolated" is missing — a phantom dependency would resolve silently',
  );
}

const releaseAge = /^\s*minimumReleaseAge\s*=\s*(\d+)\s*$/m.exec(bunfig);
if (releaseAge) {
  const days = Math.round(Number(releaseAge[1]) / 86_400);
  pass("bunfig.toml guards against fresh releases", `minimumReleaseAge = ${days} day(s)`);
} else {
  fail(
    "bunfig.toml guards against fresh releases",
    "[install] minimumReleaseAge is missing — a compromised release could be pulled in immediately",
  );
}

// The project tracks prerelease channels day to day, so the age guard needs
// exemptions. The exemption list must not rot: every entry has to be a
// dependency the project actually declares.
//
// The companion check is the frozen-lockfile install above: a pinned version
// that is too fresh to pass the guard and not exempt would fail there.
const excludes = /^\s*minimumReleaseAgeExcludes\s*=\s*\[([^\]]*)\]/m.exec(bunfig);
const excluded = new Set(
  (excludes?.[1] ?? "")
    .split(",")
    .map((name) => name.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean),
);

if (excluded.size === 0) {
  fail(
    "the age-guard exemptions are declared",
    "minimumReleaseAgeExcludes is empty — the pinned prerelease channels cannot be installed",
  );
} else {
  const stale = [...excluded].filter((name) => !declared.includes(name));
  if (stale.length > 0) {
    fail(
      "the age-guard exemptions are declared",
      `${stale.join(", ")} — exempt but not a dependency`,
    );
  } else {
    pass(
      "the age-guard exemptions are declared",
      `${[...excluded].join(", ")} — all declared dependencies`,
    );
  }
}

// The global virtual store makes warm installs much faster, but it adds a
// second symlink hop and Turbopack then cannot statically resolve the
// re-exports of `@sentry/react`, so the build fails. The isolated linker on
// its own is fine.
if (/^\s*globalStore\s*=\s*true\s*$/m.test(bunfig)) {
  fail(
    "bunfig.toml does not use the global virtual store",
    "[install] globalStore = true breaks Turbopack's export resolution of @sentry/react",
  );
} else {
  pass(
    "bunfig.toml does not use the global virtual store",
    "the store stays in the project, where Turbopack can follow it",
  );
}

// Bun's own `coverageThreshold` is broken in the pinned build: it exits
// non-zero for every value and prints no diagnostic. The project enforces the
// floor with `scripts/coverage.ts` instead, so the broken key must not be
// there.
if (/^\s*coverageThreshold\s*=/m.test(bunfig)) {
  fail(
    "bunfig.toml does not use the broken coverage threshold",
    "coverageThreshold is set — it fails every run in this Bun build; use coverageFloor instead",
  );
} else {
  pass(
    "bunfig.toml does not use the broken coverage threshold",
    "the floor is enforced by scripts/coverage.ts",
  );
}

// The coverage gate has to be wired up, or the floor is decoration.
const coverageFloor = /^\s*coverageFloor\s*=\s*\{([^}]*)\}/m.exec(bunfig);
const testScript = pkg.scripts?.["test:coverage"] ?? "";

if (!existsSync("scripts/coverage.ts")) {
  fail("the coverage gate is wired up", "scripts/coverage.ts is missing");
} else if (!coverageFloor) {
  fail("the coverage gate is wired up", "bunfig.toml declares no [test] coverageFloor");
} else if (!testScript.includes("scripts/coverage.ts")) {
  fail(
    "the coverage gate is wired up",
    `the test:coverage script is "${testScript}" — it must run scripts/coverage.ts`,
  );
} else {
  const floors = coverageFloor[1]
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  pass(
    "the coverage gate is wired up",
    `test:coverage → scripts/coverage.ts (${floors.join(", ")})`,
  );
}

// Every test file gets a fresh global and a fresh module registry, so one
// file's mock, cache or polyfill cannot reach another. Without it, a
// `mock.module` in one file replaces the module for every other file too.
const testCommand = pkg.scripts?.test ?? "";
if (/--isolate/.test(testCommand)) {
  pass("the test suite is isolated", `"${testCommand}"`);
} else {
  fail(
    "the test suite is isolated",
    `the test script is "${testCommand}" — it must pass --isolate`,
  );
}

// A random order catches a test that quietly depends on another one.
if (/^\s*randomize\s*=\s*true\s*$/m.test(bunfig)) {
  pass("the test order is randomised", "[test] randomize = true");
} else {
  warn(
    "the test order is randomised",
    "[test] randomize is missing — an order-dependent test would pass by luck",
  );
}

// Running each file twice catches a test that depends on a clean module —
// a cached value, a mocked global — because the second run sees the state
// the first one left behind.
const rerunEach = /^\s*rerunEach\s*=\s*(\d+)\s*$/m.exec(bunfig);
if (rerunEach && Number(rerunEach[1]) >= 2) {
  pass("the test suite is re-run", `[test] rerunEach = ${rerunEach[1]}`);
} else {
  warn(
    "the test suite is re-run",
    "[test] rerunEach is below 2 — a test that needs a clean module would pass",
  );
}

// A ratchet on the lint warnings. The React Compiler findings are warnings
// on purpose, so the count is capped rather than the lint being strict.
if (/^\s*maxWarnings\s*=\s*\d+\s*$/m.test(bunfig)) {
  const max = /^\s*maxWarnings\s*=\s*(\d+)\s*$/m.exec(bunfig);
  pass("the lint warning count is ratcheted", `[lint] maxWarnings = ${max?.[1]}`);
} else {
  warn(
    "the lint warning count is ratcheted",
    "[lint] maxWarnings is missing — new warnings would pass unnoticed",
  );
}

// The type-aware lint rules are the ones that need the type information to
// be useful, such as `@typescript-eslint/no-floating-promises`.
if (/^\s*typeAware\s*=\s*true\s*$/m.test(bunfig)) {
  pass("the linter is type-aware", "[lint] typeAware = true");
} else {
  warn(
    "the linter is type-aware",
    "[lint] typeAware is missing — the rules that need types stay off",
  );
}

// Every configuration file is TypeScript. A `.mjs` or `.cjs` config is a
// file the type checker never sees.
const jsConfigs: string[] = [];
for (const pattern of ["*.config.js", "*.config.mjs", "*.config.cjs"]) {
  for await (const file of new Bun.Glob(pattern).scan({ cwd: "." })) {
    jsConfigs.push(file);
  }
}

if (jsConfigs.length === 0) {
  pass("every config file is TypeScript", "no .js, .mjs or .cjs configuration files");
} else {
  fail(
    "every config file is TypeScript",
    `${jsConfigs.join(", ")} — convert them to .ts so the type checker sees them`,
  );
}

// ── The Supabase edge functions are type-checked ─────────────────────────────
//
// The edge functions run on Deno — the Supabase edge runtime is Deno — so
// they are checked with Deno, not with Bun. Bun cannot resolve their `jsr:`
// imports, and the root tsconfig excludes them.

const edgeConfig = "supabase/functions/deno.json";
const edgeCheck = pkg.scripts?.["typecheck:edge"] ?? "";
const edgeLint = pkg.scripts?.["lint:edge"] ?? "";

if (!existsSync(edgeConfig)) {
  fail("the edge functions are type-checked", `${edgeConfig} is missing`);
} else if (!edgeCheck.includes(edgeConfig) || !edgeLint.includes(edgeConfig)) {
  fail(
    "the edge functions are type-checked",
    "the typecheck:edge and lint:edge scripts must pass --config " + edgeConfig,
  );
} else if (!Bun.which("deno")) {
  warn(
    "the edge functions are type-checked",
    'Deno is not on PATH — run "bun run typecheck:edge" with Deno installed',
  );
} else {
  pass(
    "the edge functions are type-checked",
    `deno check + deno lint, configured by ${edgeConfig}`,
  );
}

// ── The documentation points at files that exist ─────────────────────────────
//
// A doc that names a file which has been renamed or removed is worse than no
// doc: it sends a reader to look for code that is not there. This is the
// exact drift that `middleware.ts` → `proxy.ts` left behind.
//
// A reference is *not* expected to resolve when the line says it is a plan
// or a former name — "Create …", "renamed", "used to be" — so those are
// skipped rather than reported.

const docFiles: string[] = [];
for (const pattern of ["docs/*.md", "*.md"]) {
  for await (const file of new Bun.Glob(pattern).scan({ cwd: "." })) {
    if (!docFiles.includes(file)) docFiles.push(file);
  }
}

/**
 * Words that mean the reference is *not* a current file: a plan, or a former
 * name. The window is the line and its neighbours, because markdown wraps a
 * sentence across lines and the qualifier is often on the line before.
 */
const NOT_A_FILE =
  /\b(create[ds]?|creating|renamed|used to be|no longer|replac(?:e|es|ed)|instead of|rather than|gone|removed|deleted|never|not done|not implemented|previously|formerly)\b/i;

const docPathPattern = /`([A-Za-z0-9_./-]+\.(?:ts|tsx|js|mjs|cjs|json|css|sql|md|toml|yml|yaml))`/g;

const missingDocs: string[] = [];

for (const file of docFiles) {
  const lines = (await Bun.file(file).text()).split("\n");
  lines.forEach((line, index) => {
    const context = [lines[index - 1], line, lines[index + 1]].filter(Boolean).join("\n");

    for (const match of line.matchAll(docPathPattern)) {
      const reference = match[1].replace(/^\//, "");
      if (reference.includes("://") || reference.startsWith("node_modules")) continue;

      // The doc says the file is absent — "no `tailwind.config.ts`".
      const prefix = line.slice(0, match.index ?? 0);
      if (/\bno\s*$/i.test(prefix)) continue;

      // The doc presents it as a plan, or as a name it used to have.
      if (NOT_A_FILE.test(context)) continue;

      const resolves = [reference, `docs/${reference}`, `supabase/migrations/${reference}`].some(
        (candidate) => existsSync(candidate),
      );
      if (!resolves) missingDocs.push(`${file}:${index + 1} → ${match[1]}`);
    }
  });
}

if (docFiles.length === 0) {
  warn("the documentation points at files that exist", "no documentation files found");
} else if (missingDocs.length === 0) {
  pass(
    "the documentation points at files that exist",
    `${docFiles.length} document(s), every path resolves`,
  );
} else {
  warn("the documentation points at files that exist", missingDocs.join(", "));
}

// ── The environment is documented ─────────────────────────────────────────────
//
// An env var the app reads but `.env.example` does not list is a variable a
// developer will never set. The reverse — a variable listed but read by
// nothing — is noise that sends people down the wrong path.

const envExample = await Bun.file(".env.example").text();
const declaredEnv = new Set<string>();
for (const match of envExample.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)) {
  declaredEnv.add(match[1]);
}

const usedEnv = new Set<string>();
const envPatterns = [
  "app/**/*.{ts,tsx}",
  "components/**/*.{ts,tsx}",
  "context/**/*.{ts,tsx}",
  "hooks/**/*.{ts,tsx}",
  "lib/**/*.{ts,tsx}",
  "proxy.ts",
  "next.config.ts",
  "sentry.*.config.ts",
];

// `process.env.NAME` and `Deno.env.get("NAME")`. The lookahead keeps a
// wildcard mention such as `process.env.NEXT_PUBLIC_*` out of the set.
const processEnv = /process\.env\.([A-Z][A-Z0-9_]*[A-Z0-9])(?![A-Z0-9_])/g;
const denoEnv = /Deno\.env\.get\(\s*["']([A-Z][A-Z0-9_]*)["']\s*\)/g;

for (const pattern of envPatterns) {
  for await (const file of new Bun.Glob(pattern).scan({ cwd: "." })) {
    const text = await Bun.file(file).text();
    for (const match of text.matchAll(processEnv)) usedEnv.add(match[1]);
  }
}

// The edge functions get their environment from the Supabase dashboard, not
// from `.env`, but the variables they read are still real ones.
for await (const file of new Bun.Glob("supabase/functions/*/index.ts").scan({ cwd: "." })) {
  for (const match of (await Bun.file(file).text()).matchAll(denoEnv)) usedEnv.add(match[1]);
}

// The platform sets these; they are not the developer's to configure.
// `CI` and `NODE_ENV` come from the runner and from Next.js, and
// `SUPABASE_URL` and `SUPABASE_ANON_KEY` are injected into the edge runtime
// by Supabase itself.
const PLATFORM_ENV = new Set(["CI", "NODE_ENV", "SUPABASE_URL", "SUPABASE_ANON_KEY"]);

const undeclared = [...usedEnv]
  .filter((name) => !declaredEnv.has(name) && !PLATFORM_ENV.has(name))
  .sort();
const unusedEnv = [...declaredEnv].filter((name) => !usedEnv.has(name)).sort();

if (undeclared.length === 0 && unusedEnv.length === 0) {
  pass(
    "the environment is documented",
    `${declaredEnv.size} variable(s), every one read and every one declared`,
  );
} else {
  const problems: string[] = [];
  if (undeclared.length > 0) {
    problems.push(`read but not in .env.example: ${undeclared.join(", ")}`);
  }
  if (unusedEnv.length > 0) {
    problems.push(`in .env.example but read by nothing: ${unusedEnv.join(", ")}`);
  }
  warn("the environment is documented", problems.join("; "));
}

// ── The migrations create the tables they assume ─────────────────────────────
//
// A migration that alters or indexes a table no migration creates only works
// on a database where that table was made out of band. Applying the chain to
// a fresh database fails. This is a warning rather than a failure: the
// production database has the tables, and the fix — a migration that creates
// them — is a schema decision, not a tooling one.

const createdTables = new Set<string>();
const referencedTables = new Set<string>();

for await (const file of new Bun.Glob("supabase/migrations/*.sql").scan({ cwd: "." })) {
  const sql = await Bun.file(file).text();

  for (const match of sql.matchAll(
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?"?(\w+)"?/gi,
  )) {
    createdTables.add(match[1].toLowerCase());
  }

  for (const match of sql.matchAll(
    /(?:ALTER\s+TABLE|CREATE\s+(?:UNIQUE\s+)?INDEX[^;]*?ON|INSERT\s+INTO|CREATE\s+POLICY[^;]*?ON|REFERENCES)\s+(?:public\.)?"?(\w+)"?/gi,
  )) {
    referencedTables.add(match[1].toLowerCase());
  }
}

// `auth.users` and the extension tables belong to Supabase, not to us.
const EXTERNAL_TABLES = new Set(["users", "auth", "extensions", "pg_catalog"]);
const assumed = [...referencedTables]
  .filter((table) => !createdTables.has(table) && !EXTERNAL_TABLES.has(table))
  .sort();

if (assumed.length === 0) {
  pass(
    "the migrations create the tables they assume",
    `${createdTables.size} table(s) created, nothing assumed`,
  );
} else {
  warn(
    "the migrations create the tables they assume",
    `${assumed.join(", ")} — no migration creates ${assumed.length === 1 ? "it" : "them"}; a fresh database cannot be built from this chain`,
  );
}

// ── No secret is committed ───────────────────────────────────────────────────
//
// A credential in a tracked file is in the git history forever, and a
// repository is public. The value is never printed — only where it is.
//
// The rules live in `scripts/lib/secrets.ts`, shared with
// `scripts/audit-secrets.ts`, which walks the whole history. The history
// half runs here too: a credential that was committed and later removed is
// still in the commits, and only a rotation fixes that.

const tracked = Bun.spawnSync(["git", "ls-files"], { stdout: "pipe" })
  .stdout.toString()
  .split("\n")
  .filter(Boolean);

const workingTreeFindings: SecretFinding[] = [];
for (const file of tracked) {
  // The lockfile holds hashes rather than secrets.
  if (file.endsWith(".lock") || file === "bun.lock") continue;
  const text = await Bun.file(file)
    .text()
    .catch(() => "");
  if (text === "") continue;
  workingTreeFindings.push(...findSecrets(file, text));
}

if (tracked.length === 0) {
  warn("no secret is committed", "git ls-files returned nothing");
} else if (workingTreeFindings.length > 0) {
  fail(
    "no secret is committed",
    `${workingTreeFindings.map((finding) => `${finding.path} (${finding.what})`).join(", ")} — rotate the credential, then remove it from the file`,
  );
} else {
  pass("no secret is committed", `${tracked.length} tracked file(s), nothing credential-shaped`);
}

let historyFindings: SecretFinding[] = [];
let historyError: string | null = null;
try {
  historyFindings = findSecretsInHistory();
} catch (error) {
  historyError = error instanceof Error ? error.message : String(error);
}

// A credential that was committed before the audit existed is recorded by
// its digest, so the doctor can tell "known, being rotated" from "new".
const knownDigests = new Set(
  (
    (await Bun.file("scripts/known-secret-digests.json")
      .json()
      .catch(() => ({ known: [] }))) as {
      known?: { digest?: string }[];
    }
  ).known?.map((entry) => entry.digest ?? "") ?? [],
);

if (historyError) {
  warn("no secret is in the git history", `could not walk the history: ${historyError}`);
} else if (historyFindings.length > 0) {
  // A known credential that is in a commit that could be pushed still fails:
  // the history was rewritten to take it out, so putting it back is a live
  // leak again, whether or not it is one the team is already rotating.
  const known = historyFindings.filter((finding) => knownDigests.has(finding.digest));
  const detail = historyFindings.map((f) => `${f.path} (${f.what})`).join(", ");

  fail(
    "no secret is in the git history",
    known.length > 0
      ? `${detail} — ${known.length} of these are known leaks that are being rotated, but they are in a commit that could be pushed: rewrite it`
      : `${detail} — rotate the credentials, then rewrite the history`,
  );
} else {
  pass("no secret is in the git history", "the reachable history is clean");
}

// ── The migrations create the columns the application reads ──────────────────
//
// The generated types in `lib/types/database.types.ts` are the contract: they
// are generated from the live database, and the application reads them. A
// column the types declare but no migration creates is a column a fresh
// database does not have — and the failure is silent, because a query for a
// missing column throws and the error is swallowed.
//
// The check is offline: it compares what the migrations create with what the
// types declare. `bun run check:migrations` proves it against a real
// Postgres.

const migrationColumns = new Map<string, Set<string>>();

for await (const file of new Bun.Glob("supabase/migrations/*.sql").scan({ cwd: "." })) {
  const sql = await Bun.file(file).text();

  // CREATE TABLE public.x ( ... ) — one column per line.
  for (const match of sql.matchAll(
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?"?(\w+)"?\s*\(([\s\S]*?)\n\);/gi,
  )) {
    const [, table, body] = match;
    const columns = migrationColumns.get(table.toLowerCase()) ?? new Set<string>();
    for (const line of body.split("\n")) {
      const column = line
        .trim()
        .match(/^"?(\w+)"?\s+(?!constraint\b|primary\b|foreign\b|unique\b|check\b|exclude\b)/i);
      if (column) columns.add(column[1].toLowerCase());
    }
    migrationColumns.set(table.toLowerCase(), columns);
  }

  // ALTER TABLE public.x ADD COLUMN [IF NOT EXISTS] y ... — the statement can
  // add several columns at once, so every ADD COLUMN in it is collected.
  for (const match of sql.matchAll(/ALTER\s+TABLE\s+(?:public\.)?"?(\w+)"?\s+([^;]+);/gi)) {
    const [, table, body] = match;
    const columns = migrationColumns.get(table.toLowerCase()) ?? new Set<string>();
    for (const add of body.matchAll(/ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?"?(\w+)"?/gi)) {
      columns.add(add[1].toLowerCase());
    }
    migrationColumns.set(table.toLowerCase(), columns);
  }
}

// The expected columns, from the generated types.
const expectedColumns = new Map<string, Set<string>>();
const types = await Bun.file("lib/types/database.types.ts").text();
const tablesBlock = types.slice(
  types.indexOf("Tables: {"),
  types.indexOf("\n    Functions:") > 0 ? types.indexOf("\n    Functions:") : types.length,
);

for (const table of tablesBlock.matchAll(/^ {6}(\w+): \{$/gm)) {
  const from = table.index;
  const to = tablesBlock.indexOf("\n      };", from);
  const block = tablesBlock.slice(from, to);
  const rowStart = block.indexOf("Row: {");
  const rowEnd = block.indexOf("};", rowStart);
  const columns = new Set<string>();
  // Skip the "Row: {" line itself — it is a label, not a column.
  for (const line of block.slice(rowStart, rowEnd).split("\n").slice(1)) {
    const column = line.trim().match(/^(\w+)\??:/);
    if (column) columns.add(column[1].toLowerCase());
  }
  expectedColumns.set(table[1].toLowerCase(), columns);
}

const missingColumns: string[] = [];
for (const [table, expected] of expectedColumns) {
  const created = migrationColumns.get(table);
  if (!created) continue;
  for (const column of expected) {
    if (!created.has(column)) missingColumns.push(`${table}.${column}`);
  }
}

if (missingColumns.length === 0) {
  pass(
    "the migrations create the columns the application reads",
    `${expectedColumns.size} table(s), every declared column created`,
  );
} else {
  fail(
    "the migrations create the columns the application reads",
    `${missingColumns.join(", ")} — no migration creates them`,
  );
}

// ── The migrations create the unique constraints the application assumes ─────
//
// `POST /api/v1/sync-episodes` upserts with `onConflict: "episode_id"`, and
// PostgREST turns that into `INSERT ... ON CONFLICT (episode_id) DO UPDATE`.
// Postgres needs a unique index on the column: without one it raises 42P10,
// and the endpoint answers `success` while syncing nothing. The chain had
// only a plain index, so a database built from the migrations could not serve
// the endpoint.
//
// The conflict targets are read out of the application, so an upsert is
// covered as soon as it is written.

const conflictTargets: Array<{ table: string; columns: string[] }> = [];

for await (const file of new Bun.Glob("{app,lib,components}/**/*.{ts,tsx}").scan({ cwd: "." })) {
  const source = await Bun.file(file).text();

  for (const match of source.matchAll(/onConflict:\s*["'`]([^"'`]+)["'`]/g)) {
    // The table is the one the statement selected from, which is the closest
    // `.from(…)` before the conflict target.
    const before = source.slice(0, match.index);
    const from = [...before.matchAll(/\.from\(["'`](\w+)["'`]\)/g)].pop();
    if (!from) continue;

    conflictTargets.push({
      table: from[1].toLowerCase(),
      columns: match[1].split(",").map((column) => column.trim().toLowerCase()),
    });
  }
}

// The unique column groups the migrations create, per table.
const uniqueColumns = new Map<string, Set<string>>();

const addUnique = (table: string, columns: string): void => {
  const key = table.toLowerCase();
  const set = uniqueColumns.get(key) ?? new Set<string>();
  set.add(columns);
  uniqueColumns.set(key, set);
};

const columnList = (body: string): string =>
  body
    .split(",")
    .map((column) =>
      column
        .trim()
        .replace(/^["'`]|["'`]$/g, "")
        .toLowerCase(),
    )
    .join(",");

for await (const file of new Bun.Glob("supabase/migrations/*.sql").scan({ cwd: "." })) {
  const sql = await Bun.file(file).text();

  // CREATE UNIQUE INDEX name ON public.table (columns)
  for (const match of sql.matchAll(
    /CREATE\s+UNIQUE\s+INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:"?\w+"?)\s+ON\s+(?:public\.)?"?(\w+)"?\s*(?:USING\s+\w+\s*)?\(([^)]+)\)/gi,
  )) {
    addUnique(match[1], columnList(match[2]));
  }

  // CREATE TABLE public.table ( ... CONSTRAINT name UNIQUE (columns) ... )
  for (const match of sql.matchAll(
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?"?(\w+)"?\s*\(([\s\S]*?)\n\);/gi,
  )) {
    const [, table, body] = match;
    for (const constraint of body.matchAll(/UNIQUE\s*\(([^)]+)\)/gi)) {
      addUnique(table, columnList(constraint[1]));
    }
  }

  // ALTER TABLE public.table ADD CONSTRAINT name UNIQUE (columns)
  for (const match of sql.matchAll(
    /ALTER\s+TABLE\s+(?:public\.)?"?(\w+)"?\s+ADD\s+CONSTRAINT[^;]*?UNIQUE\s*\(([^)]+)\)/gi,
  )) {
    addUnique(match[1], columnList(match[2]));
  }
}

const missingUniques: string[] = [];
for (const target of conflictTargets) {
  const created = uniqueColumns.get(target.table);
  if (!created?.has(target.columns.join(","))) {
    missingUniques.push(`${target.table}(${target.columns.join(",")})`);
  }
}

if (conflictTargets.length === 0) {
  pass(
    "the migrations create the unique constraints the application assumes",
    "the application upserts on nothing",
  );
} else if (missingUniques.length === 0) {
  pass(
    "the migrations create the unique constraints the application assumes",
    `${conflictTargets.length} conflict target(s), every one created`,
  );
} else {
  fail(
    "the migrations create the unique constraints the application assumes",
    `${[...new Set(missingUniques)].join(", ")} — no migration makes it unique, so the upsert raises 42P10 and syncs nothing`,
  );
}

// The migration chain has to be checked against a real database, not just
// read.
if (!existsSync("scripts/check-migrations.ts")) {
  fail("the migration chain is checked", "scripts/check-migrations.ts is missing");
} else if (!(pkg.scripts?.["check:migrations"] ?? "").includes("check-migrations.ts")) {
  fail(
    "the migration chain is checked",
    "the check:migrations script must run scripts/check-migrations.ts",
  );
} else {
  pass(
    "the migration chain is checked",
    "bun run check:migrations — applies the chain to a throwaway Postgres",
  );
}

// ── Every route has a skip-link target ───────────────────────────────────────
//
// The root layout offers a "Skip to content" link that points at
// `#main-content`. Only the pages that use <AppShell> had that id, so on the
// rest of the site the link did nothing.
//
// The check walks a route's imports, because a route usually renders a client
// component that carries the shell — the auth pages reach <AuthShell> that
// way.

const SKIP_TARGET = /id="main-content"|<AppShell\b|<AuthShell\b/;

/**
 * The source with its comments removed.
 *
 * A comment that mentions `<AppShell` — "this page does not use <AppShell>" —
 * would otherwise satisfy the pattern, and the check would pass on a route
 * that has no target at all.
 */
function withoutComments(text: string): string {
  return (
    text
      .replace(/\/\*[\s\S]*?\*\//g, "")
      // A `//` that is not part of `://`.
      .replace(/(^|[^:])\/\/.*$/gm, "$1")
  );
}

/** The sources a route renders, directly or through its imports. */
async function routeSources(file: string): Promise<string> {
  const seen = new Set<string>();
  const queue = [file];
  const parts: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (seen.has(current)) continue;
    seen.add(current);

    const text = await Bun.file(current)
      .text()
      .catch(() => "");
    if (text === "") continue;
    parts.push(text);

    for (const match of text.matchAll(/from\s+"([^"]+)"/g)) {
      const specifier = match[1];
      if (!specifier.startsWith(".") && !specifier.startsWith("@/")) continue;

      const base = specifier.startsWith("@/")
        ? specifier.slice(2)
        : join(dirname(current), specifier);

      for (const candidate of [`${base}.tsx`, `${base}.ts`, join(base, "index.tsx")]) {
        if (existsSync(candidate)) {
          queue.push(candidate);
          break;
        }
      }
    }
  }

  return parts.join("\n");
}

const routesWithoutTarget: string[] = [];

for await (const file of new Bun.Glob("app/**/page.tsx").scan({ cwd: "." })) {
  const text = await Bun.file(file).text();

  // A route that only redirects never renders its own content.
  if (text.includes("redirect(") && !SKIP_TARGET.test(withoutComments(text))) continue;

  const sources = await routeSources(file);
  if (!SKIP_TARGET.test(withoutComments(sources))) routesWithoutTarget.push(file);
}

if (routesWithoutTarget.length === 0) {
  pass("every route has a skip-link target", "no route renders without #main-content");
} else {
  fail(
    "every route has a skip-link target",
    `${routesWithoutTarget.join(", ")} — no #main-content, so "Skip to content" does nothing`,
  );
}

// ── Unused direct dependencies ───────────────────────────────────────────────
//
// The isolated linker makes a *missing* dependency fail loudly. It cannot
// see an unused one: a package nothing imports still sits in the lockfile,
// in the install and in the supply-chain surface. This check finds it.

/**
 * Dependencies that are used without ever being imported.
 *
 * The type packages are resolved by the compiler rather than imported, and
 * Next.js looks for the native TypeScript compiler on its own.
 */
const IMPLICITLY_USED = new Set(["@types/node", "@typescript/native-preview"]);

const importSpecifiers = new Set<string>();
const specifierPattern = /(?:from|import|require)\s*\(?\s*["']([^"']+)["']/g;

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
    for (const match of (await Bun.file(file).text()).matchAll(specifierPattern)) {
      importSpecifiers.add(match[1]);
    }
  }
}

// Stylesheets and configuration files name their packages in other ways:
// `@import "tailwindcss"` in CSS, `"@tailwindcss/postcss"` in a config.
const otherText: string[] = [];
for (const pattern of ["app/**/*.css", "components/**/*.css", "*.config.ts"]) {
  for await (const file of new Bun.Glob(pattern).scan({ cwd: "." })) {
    otherText.push(await Bun.file(file).text());
  }
}

// A package listed in the compiler's `types` is used by the compiler, not
// by an import — `bun-types` is the type surface for the whole project.
const tsconfig = Bun.JSONC.parse(await Bun.file("tsconfig.json").text()) as {
  compilerOptions?: { types?: string[] };
};
for (const name of tsconfig.compilerOptions?.types ?? []) {
  importSpecifiers.add(name);
}

// A peer dependency of a direct dependency has to be declared, or the
// package manager cannot satisfy it — `next` needs `react` and `react-dom`.
for (const name of declared) {
  const manifestPath = `node_modules/${name}/package.json`;
  if (!existsSync(manifestPath)) continue;
  const manifest = (await Bun.file(manifestPath).json()) as {
    peerDependencies?: Record<string, string>;
  };
  for (const peer of Object.keys(manifest.peerDependencies ?? {})) {
    importSpecifiers.add(peer);
  }
}

function isUsed(name: string): boolean {
  // An `@types/X` package serves `X`, not itself.
  const target = name.startsWith("@types/") ? name.slice("@types/".length) : name;

  for (const specifier of importSpecifiers) {
    if (specifier === target || specifier.startsWith(`${target}/`)) return true;
  }
  return otherText.some((text) => text.includes(target));
}

const unused = declared.filter((name) => !IMPLICITLY_USED.has(name) && !isUsed(name));

if (unused.length === 0) {
  pass("every direct dependency is used", `${declared.length} dependencies, all imported`);
} else {
  warn(
    "every direct dependency is used",
    `${unused.join(", ")} — nothing imports them; run "bun remove ${unused[0]}"`,
  );
}

// ── 10. No source file imports a `node:` module ──────────────────────────────
//
// `types/bun-modules.d.ts` declares the `bun:*` modules against Bun's own
// API, so the project no longer needs a single `node:` specifier — not even
// in type position.

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
  ".githooks/*",
  "*.{ts,tsx,mjs,js}",
]) {
  for await (const file of new Bun.Glob(pattern).scan({ cwd: "." })) {
    if (nodeImport.test(await Bun.file(file).text())) nodeImporters.push(file);
  }
}

if (nodeImporters.length === 0) {
  pass("no source file imports a node: module", "no file names a node: specifier at all");
} else {
  fail("no source file imports a node: module", nodeImporters.join(", "));
}

// ── 11. No Node.js package is a direct dependency ────────────────────────────

const devDependencies = pkg.devDependencies ?? {};

// Next.js's build refuses to start without `@types/node` — it says so
// explicitly and asks for `typescript@^6` alongside it. It is types only, so
// nothing about it puts a Node.js runtime in the project, but it has to stay
// a direct dependency for Next to find.
if (devDependencies["@types/node"]) {
  pass(
    "@types/node is a direct dependency",
    `${devDependencies["@types/node"]} — Next.js requires it to build`,
  );
} else {
  fail(
    "@types/node is a direct dependency",
    "Next.js refuses to build without it — it must not be left to arrive transitively",
  );
}

// Any *other* Node.js package is a mistake: the project runs on Bun.
const nodePackages = [...declared].filter(
  (name) => name !== "@types/node" && (name === "node" || name.startsWith("node-")),
);

if (nodePackages.length === 0) {
  pass("no Node.js runtime package is a direct dependency", "the dependency tree declares none");
} else {
  fail(
    "no Node.js runtime package is a direct dependency",
    `${nodePackages.join(", ")} — this project runs on Bun`,
  );
}

// ── 12. The type gate is tsrs ────────────────────────────────────────────────

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

// ── 13. The git hooks are Bun scripts ────────────────────────────────────────

const hookFiles: string[] = [];
for await (const file of new Bun.Glob(".githooks/*").scan({ cwd: "." })) {
  hookFiles.push(file);
}

const nonBunHooks: string[] = [];
for (const file of hookFiles) {
  const firstLine = (await Bun.file(file).text()).split("\n")[0] ?? "";
  if (!firstLine.startsWith("#!") || !/\bbun\b/.test(firstLine)) nonBunHooks.push(file);
}

if (hookFiles.length === 0) {
  fail("the git hooks are Bun scripts", ".githooks/ is empty or missing");
} else if (nonBunHooks.length > 0) {
  fail("the git hooks are Bun scripts", `${nonBunHooks.join(", ")} do not run on Bun`);
} else {
  pass("the git hooks are Bun scripts", `${hookFiles.length} hook(s), all with a Bun shebang`);
}

if (devDependencies.lefthook) {
  fail("no hook runner is a Node.js package", "lefthook is still a devDependency");
} else {
  pass("no hook runner is a Node.js package", "the hooks are Bun scripts in .githooks/");
}

// ── 14. CI never pulls in Node.js ────────────────────────────────────────────

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
// that day, or local and CI would run different builds. Every workflow that
// runs Bun has to do it — a workflow that quietly uses the canary is a
// workflow that can fail on a day the build broke.
const installsPinnedBun = await Promise.all(
  workflows.map(async (file) => {
    const text = await Bun.file(file).text();
    return /scripts\/install-bun\.ts/.test(text);
  }),
);

if (workflows.length === 0) {
  warn("CI installs the pinned Bun", "no workflow files found");
} else if (installsPinnedBun.every(Boolean)) {
  pass("CI installs the pinned Bun", "every workflow installs the build pinned by .bun-version");
} else {
  const missing = workflows.filter((_, index) => !installsPinnedBun[index]);
  fail(
    "CI installs the pinned Bun",
    `${missing.join(", ")} — run "bun scripts/install-bun.ts --output-dir \\"$HOME/.bun/bin\\"" there`,
  );
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
