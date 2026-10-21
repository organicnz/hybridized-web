#!/usr/bin/env bun
/**
 * Coverage gate.
 *
 * Runs the test suite with coverage on, reads the lcov report Bun writes, and
 * fails when the totals fall below the floor declared in `bunfig.toml`:
 *
 *     [test]
 *     coverageFloor = { lines = 0.8, functions = 0.8 }
 *
 * Why not Bun's own `coverageThreshold`? Because it is broken in the Bun build
 * this project pins: `1.4.4-canary.1` exits non-zero for *any* threshold
 * value, from 0.9 down to 0.001, and prints no diagnostic. `scripts/doctor.ts`
 * fails if `coverageThreshold` is added back to `bunfig.toml` — a gate that
 * always fails is not a gate, it is a broken build.
 *
 * The thresholds live in `bunfig.toml` rather than in this file so there is
 * one place to look for them.
 */
import { existsSync } from "bun:fs";
import { join } from "bun:path";

const repoRoot = join(import.meta.dir, "..");
const lcovPath = join(repoRoot, "coverage", "lcov.info");

interface Floor {
  lines: number;
  functions: number;
}

interface Coverage {
  lines: { found: number; hit: number };
  functions: { found: number; hit: number };
  files: { path: string; lines: number; functions: number }[];
}

/** The floor declared in `bunfig.toml`, or the default when it is missing. */
async function readFloor(): Promise<Floor> {
  const config = Bun.TOML.parse(await Bun.file(join(repoRoot, "bunfig.toml")).text()) as {
    test?: { coverageFloor?: Partial<Floor> };
  };
  const floor = config.test?.coverageFloor ?? {};
  return { lines: floor.lines ?? 0.8, functions: floor.functions ?? 0.8 };
}

/** Parse an lcov report into totals. */
function parseLcov(text: string): Coverage {
  const coverage: Coverage = {
    lines: { found: 0, hit: 0 },
    functions: { found: 0, hit: 0 },
    files: [],
  };

  let path = "";
  let lineFound = 0;
  let lineHit = 0;
  let functionFound = 0;
  let functionHit = 0;

  const flush = () => {
    if (path === "") return;
    coverage.lines.found += lineFound;
    coverage.lines.hit += lineHit;
    coverage.functions.found += functionFound;
    coverage.functions.hit += functionHit;
    coverage.files.push({
      path,
      lines: lineFound === 0 ? 1 : lineHit / lineFound,
      functions: functionFound === 0 ? 1 : functionHit / functionFound,
    });
    path = "";
    lineFound = 0;
    lineHit = 0;
    functionFound = 0;
    functionHit = 0;
  };

  for (const line of text.split("\n")) {
    if (line.startsWith("SF:")) {
      flush();
      path = line.slice(3).trim();
    } else if (line.startsWith("LF:")) {
      lineFound = Number(line.slice(3));
    } else if (line.startsWith("LH:")) {
      lineHit = Number(line.slice(3));
    } else if (line.startsWith("FNF:")) {
      functionFound = Number(line.slice(4));
    } else if (line.startsWith("FNH:")) {
      functionHit = Number(line.slice(4));
    }
  }
  flush();

  return coverage;
}

/** The ratio, as a percentage. */
function percent(hit: number, found: number): number {
  return found === 0 ? 100 : (hit / found) * 100;
}

const floor = await readFloor();

console.log("\n▸ test (with coverage)");
// The same command the `test` script runs, so the suite is measured under
// exactly the flags it is normally run with — `bun run test --coverage`
// forwards `--coverage` to `bun test --isolate --coverage`.
const test = Bun.spawnSync([process.execPath, "run", "test", "--coverage"], {
  cwd: repoRoot,
  stdio: ["inherit", "inherit", "inherit"],
});

if (test.exitCode !== 0) {
  console.error("\n✗ the test suite failed");
  process.exit(test.exitCode ?? 1);
}

if (!existsSync(lcovPath)) {
  console.error(`\n✗ no coverage report at ${lcovPath}`);
  process.exit(1);
}

const coverage = parseLcov(await Bun.file(lcovPath).text());
const linePct = percent(coverage.lines.hit, coverage.lines.found);
const functionPct = percent(coverage.functions.hit, coverage.functions.found);

/**
 * Every module in the measured scope has to be in the report.
 *
 * The floor only measures the files that a test imported: a module that
 * nothing imports never appears in the lcov report, so the floor cannot see
 * it, and a new file with no test at all would pass the gate. This closes
 * that: the scope is every module under these roots, and each one has to be
 * measured or explicitly exempt.
 */
const MEASURED_ROOTS = ["lib", "app/api", "scripts/lib"];

/**
 * The modules that cannot be covered without a browser.
 *
 * Each one is here for a reason: it needs a DOM, a canvas or a GPU, or it is
 * generated. A new module in this list needs the same reason.
 */
const EXEMPT = new Set([
  // A React context provider: the behaviour needs a DOM.
  "lib/audio-player-context.tsx",
  // Web Audio: it builds an oscillator graph in the browser.
  "lib/audio/note-player.ts",
  // It drives the SoundCloud widget, which is a script in the page.
  "lib/soundcloud-widget-manager.ts",
  // Generated from the database by `bun run types:supabase`.
  "lib/types/database.types.ts",
  // WebGPU: it needs a device and a shader pipeline.
  "lib/vgpu/audio-visualizer.ts",
]);

const measuredFiles = new Set(coverage.files.map((file) => file.path));
const unmeasured: string[] = [];

for (const root of MEASURED_ROOTS) {
  for await (const file of new Bun.Glob(`${root}/**/*.{ts,tsx}`).scan({ cwd: repoRoot })) {
    const relative = file.replace(`${repoRoot}/`, "");
    if (relative.endsWith(".d.ts")) continue;
    if (EXEMPT.has(relative)) continue;
    if (!measuredFiles.has(relative)) unmeasured.push(relative);
  }
}

if (unmeasured.length > 0) {
  console.error(
    `\n✗ ${unmeasured.length} module(s) are not covered by any test: ${unmeasured.join(", ")}`,
  );
  console.error("  A module no test imports never reaches the report, so the floor cannot see it.");
  process.exit(1);
}

console.log("\nCoverage");
console.log("─".repeat(64));
console.log(
  `  lines      ${linePct.toFixed(2).padStart(6)}%   floor ${(floor.lines * 100).toFixed(0)}%`,
);
console.log(
  `  functions  ${functionPct.toFixed(2).padStart(6)}%   floor ${(floor.functions * 100).toFixed(0)}%`,
);

// The least covered files, so a failure points at what to fix.
const worst = [...coverage.files]
  .filter((file) => file.lines < 1)
  .sort((a, b) => a.lines - b.lines)
  .slice(0, 5);

if (worst.length > 0) {
  console.log("\n  Least covered");
  for (const file of worst) {
    console.log(`    ${(file.lines * 100).toFixed(1).padStart(6)}%  ${file.path}`);
  }
}
console.log("─".repeat(64));

const failures: string[] = [];
if (linePct < floor.lines * 100) {
  failures.push(`lines ${linePct.toFixed(2)}% < ${(floor.lines * 100).toFixed(0)}%`);
}
if (functionPct < floor.functions * 100) {
  failures.push(`functions ${functionPct.toFixed(2)}% < ${(floor.functions * 100).toFixed(0)}%`);
}

if (failures.length > 0) {
  console.error(`\n✗ coverage is below the floor: ${failures.join(", ")}`);
  process.exit(1);
}

console.log("\n✓ coverage is above the floor");
