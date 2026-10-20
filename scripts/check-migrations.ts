#!/usr/bin/env bun
/**
 * Check the Supabase migration chain against a real Postgres.
 *
 * The migrations are the schema, and the generated types in
 * `lib/types/database.types.ts` are the contract the application reads. A
 * migration that assumes a table nobody created, or a column nobody adds,
 * only fails on a *fresh* database — the production one has whatever was
 * made out of band. So the chain is applied to a throwaway cluster here and
 * the result is compared with the contract.
 *
 * What it proves:
 *
 *   1. every migration applies, in order, to an empty database;
 *   2. the resulting schema has every column the generated types declare;
 *   3. the signup triggers fire, the admin flag persists, the search
 *      function finds rows, and row level security is on every table.
 *
 * Usage: bun scripts/check-migrations.ts
 *
 * Postgres is optional: without it the check reports that it was skipped and
 * exits cleanly, so it never blocks a machine that does not have it.
 */
import { existsSync, mkdirSync, rmSync } from "bun:fs";
import { join } from "bun:path";

const repoRoot = join(import.meta.dir, "..");
const stub = join(repoRoot, "scripts", "fixtures", "supabase-stub.sql");
const assertions = join(repoRoot, "scripts", "fixtures", "migration-assertions.sql");

/** The port the throwaway cluster listens on. */
const PORT = 54329;

/** The migrations that need a Supabase-only extension, and so cannot run here. */
const SUPABASE_ONLY = /sync_cron/;

/**
 * Where the Postgres binaries are.
 *
 * `mise` installs them under its own prefix, and the project pins the
 * version, so the binaries are looked up there first. Then the usual
 * places a distribution puts them, and finally `PATH`.
 */
function findPostgres(): { bin: string; psql: string } | null {
  const candidates = [
    ...(Bun.env.MISE_POSTGRES_PATH ? [Bun.env.MISE_POSTGRES_PATH] : []),
    join(Bun.env.HOME ?? "", ".local/share/mise/installs/postgres/18.6/bin"),
    // Where a distribution installs it, versioned.
    ...["16", "17", "18", "19"].map((version) => `/usr/lib/postgresql/${version}/bin`),
    "/usr/local/pgsql/bin",
    "/opt/homebrew/opt/postgresql@18/bin",
    "/opt/homebrew/opt/postgresql@17/bin",
    "/opt/homebrew/opt/postgresql@16/bin",
    "/usr/local/opt/postgresql@18/bin",
    // Whatever is on PATH.
    ...(Bun.env.PATH ?? "").split(":"),
  ];

  for (const dir of candidates) {
    if (!dir) continue;
    const psql = join(dir, "psql");
    const initdb = join(dir, "initdb");
    if (existsSync(psql) && existsSync(initdb)) {
      return { bin: dir, psql };
    }
  }

  // Fall back to whatever is on PATH.
  const psql = Bun.which("psql");
  const initdb = Bun.which("initdb");
  if (psql && initdb) return { bin: join(psql, ".."), psql };

  return null;
}

function run(command: string[], options: { cwd?: string; quiet?: boolean } = {}): number {
  const result = Bun.spawnSync(command, {
    cwd: options.cwd ?? repoRoot,
    stdout: options.quiet ? "pipe" : "inherit",
    stderr: options.quiet ? "pipe" : "inherit",
  });
  return result.exitCode ?? 1;
}

const postgres = findPostgres();
if (!postgres) {
  console.log("↷ skipped — no Postgres binaries found.");
  console.log('  Install one with "mise install postgres@18" to run this check.');
  process.exit(0);
}

const dataDir = join(Bun.env.TMPDIR ?? "/tmp", `hybridized-pg-${process.pid}`);
// The socket lives beside the data directory: `initdb` requires its target
// to be empty.
const socketDir = join(Bun.env.TMPDIR ?? "/tmp", `hybridized-pg-sock-${process.pid}`);

// A `const` arrow rather than a function declaration: a declaration is
// hoisted, so the compiler would analyse it before the `postgres` null check
// and lose the narrowing.
const cleanup = (): void => {
  Bun.spawnSync([join(postgres.bin, "pg_ctl"), "-D", dataDir, "-m", "immediate", "stop"], {
    stdout: "ignore",
    stderr: "ignore",
  });
  rmSync(dataDir, { recursive: true, force: true });
  rmSync(socketDir, { recursive: true, force: true });
};

let failed = false;

try {
  console.log("▸ starting a throwaway Postgres");
  rmSync(dataDir, { recursive: true, force: true });
  rmSync(socketDir, { recursive: true, force: true });
  mkdirSync(socketDir, { recursive: true });

  const initdb = Bun.spawnSync(
    [join(postgres.bin, "initdb"), "-D", dataDir, "-U", "postgres", "--auth=trust", "-E", "UTF8"],
    { stdout: "pipe", stderr: "pipe" },
  );
  if (initdb.exitCode !== 0) {
    console.error(initdb.stderr.toString().trim());
    throw new Error("initdb failed");
  }

  if (
    run(
      [
        join(postgres.bin, "pg_ctl"),
        "-D",
        dataDir,
        "-o",
        `-k ${socketDir} -h '' -p ${PORT}`,
        "-l",
        join(dataDir, "server.log"),
        "-w",
        "start",
      ],
      { quiet: true },
    ) !== 0
  ) {
    throw new Error("the server did not start");
  }

  const psql = (database: string, args: string[]): number =>
    run(
      [
        postgres.psql,
        "-h",
        socketDir,
        "-p",
        String(PORT),
        "-U",
        "postgres",
        "-d",
        database,
        ...args,
      ],
      {
        quiet: true,
      },
    );

  const dbName = "migration_check";

  console.log("▸ creating the database");
  if (
    run(
      [
        join(postgres.bin, "dropdb"),
        "-h",
        socketDir,
        "-p",
        String(PORT),
        "-U",
        "postgres",
        "--if-exists",
        dbName,
      ],
      { quiet: true },
    ) !== 0
  ) {
    throw new Error("could not drop the old database");
  }
  if (
    run(
      [
        join(postgres.bin, "createdb"),
        "-h",
        socketDir,
        "-p",
        String(PORT),
        "-U",
        "postgres",
        dbName,
      ],
      { quiet: true },
    ) !== 0
  ) {
    throw new Error("could not create the database");
  }

  console.log("▸ applying the Supabase stub");
  if (psql(dbName, ["-v", "ON_ERROR_STOP=1", "-q", "-f", stub]) !== 0) {
    throw new Error("the stub did not apply");
  }

  console.log("▸ applying the migrations");
  const migrations: string[] = [];
  for await (const file of new Bun.Glob("supabase/migrations/*.sql").scan({ cwd: repoRoot })) {
    migrations.push(file);
  }
  migrations.sort();

  for (const file of migrations) {
    const name = file.split("/").pop() ?? file;
    if (SUPABASE_ONLY.test(name)) {
      console.log(`  ↷ ${name} — skipped, it needs Supabase's pg_cron`);
      continue;
    }

    const result = Bun.spawnSync(
      [
        postgres.psql,
        "-h",
        socketDir,
        "-p",
        String(PORT),
        "-U",
        "postgres",
        "-d",
        dbName,
        "-v",
        "ON_ERROR_STOP=1",
        "-q",
        "-f",
        file,
      ],
      { stdout: "pipe", stderr: "pipe" },
    );

    if (result.exitCode !== 0) {
      console.error(`  ✗ ${name}`);
      console.error(result.stderr.toString().trim());
      throw new Error(`${name} did not apply`);
    }
    console.log(`  ✓ ${name}`);
  }

  console.log("▸ comparing the schema with the generated types");
  const columnsSql = `
    SELECT table_name || '.' || column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'`;

  const live = new Set(
    Bun.spawnSync(
      [
        postgres.psql,
        "-h",
        socketDir,
        "-p",
        String(PORT),
        "-U",
        "postgres",
        "-d",
        dbName,
        "-At",
        "-c",
        columnsSql,
      ],
      { stdout: "pipe" },
    )
      .stdout.toString()
      .split("\n")
      .filter(Boolean),
  );

  const types = await Bun.file(join(repoRoot, "lib/types/database.types.ts")).text();
  const tablesBlock = types.slice(
    types.indexOf("Tables: {"),
    types.indexOf("\n    Functions:") > 0 ? types.indexOf("\n    Functions:") : types.length,
  );

  const missing: string[] = [];
  for (const table of tablesBlock.matchAll(/^ {6}(\w+): \{$/gm)) {
    const from = table.index;
    const to = tablesBlock.indexOf("\n      };", from);
    const block = tablesBlock.slice(from, to);
    const rowStart = block.indexOf("Row: {");
    const rowEnd = block.indexOf("};", rowStart);
    for (const line of block.slice(rowStart, rowEnd).split("\n").slice(1)) {
      const column = line.trim().match(/^(\w+)\??:/);
      if (!column) continue;
      const key = `${table[1]}.${column[1]}`;
      if (!live.has(key)) missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error(`  ✗ the database is missing ${missing.join(", ")}`);
    throw new Error("the schema does not match the generated types");
  }
  console.log(`  ✓ every declared column exists (${live.size} columns)`);

  console.log("▸ checking the behaviour");
  const assertionRun = Bun.spawnSync(
    [
      postgres.psql,
      "-h",
      socketDir,
      "-p",
      String(PORT),
      "-U",
      "postgres",
      "-d",
      dbName,
      "-v",
      "ON_ERROR_STOP=1",
      "-f",
      assertions,
    ],
    { stdout: "pipe", stderr: "pipe" },
  );
  if (assertionRun.exitCode !== 0) {
    console.error(assertionRun.stderr.toString().trim());
    throw new Error("the migration assertions failed");
  }
  console.log("  ✓ the triggers, the search function and the policies all behave");
} catch (error) {
  failed = true;
  console.error(`\n✗ ${error instanceof Error ? error.message : String(error)}`);
} finally {
  cleanup();
}

if (failed) process.exit(1);
console.log("\n✓ the migration chain builds a working database");
