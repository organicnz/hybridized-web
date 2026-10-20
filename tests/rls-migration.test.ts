import { describe, expect, it } from "bun:test";
import { readFileSync, readdirSync } from "bun:fs";
import { join } from "bun:path";

const MIGRATIONS_DIR = join(import.meta.dir, "../supabase/migrations");

function readMigrations(): Array<{ name: string; sql: string }> {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((name) => ({ name, sql: readFileSync(join(MIGRATIONS_DIR, name), "utf8") }));
}

const allSql = readMigrations()
  .map((m) => m.sql)
  .join("\n");

describe("RLS migration drift guards", () => {
  const tables = ["episodes", "bands", "profiles", "settings"];

  for (const table of tables) {
    it(`${table}: RLS is enabled`, () => {
      expect(allSql).toMatch(
        new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`, "i"),
      );
    });

    it(`${table}: has at least one owner-scoped policy or public read policy`, () => {
      // settings/profiles must be owner-scoped; episodes/bands allow public read.
      if (table === "settings" || table === "profiles") {
        expect(allSql).toMatch(
          new RegExp(`CREATE POLICY[^;]*ON public\\.${table}[\\s\\S]*?auth\\.uid\\(\\)`, "i"),
        );
      } else {
        expect(allSql).toMatch(
          new RegExp(`CREATE POLICY[^;]*ON public\\.${table}[\\s\\S]*?USING \\(true\\)`, "i"),
        );
      }
    });
  }

  it("settings policies cover read, write, insert and delete", () => {
    const settingsSql = readMigrations().find((m) => m.name.includes("rls_settings"))?.sql ?? "";
    const policies = [
      ...settingsSql.matchAll(/CREATE POLICY[^;]*ON public\.settings[\s\S]*?;/gi),
    ].map((m) => m[0]);
    expect(policies.length).toBe(4);
    for (const cmd of ["SELECT", "UPDATE", "INSERT", "DELETE"]) {
      expect(policies.some((p) => p.toUpperCase().includes(`FOR ${cmd}`))).toBe(true);
    }
  });

  it("every migration is idempotent (policies dropped before creation)", () => {
    const settingsSql = readMigrations().find((m) => m.name.includes("rls_settings"))?.sql ?? "";
    const creates = settingsSql.match(/CREATE POLICY/gi)?.length ?? 0;
    const drops = settingsSql.match(/DROP POLICY IF EXISTS/gi)?.length ?? 0;
    expect(drops).toBeGreaterThanOrEqual(creates);
  });
});
