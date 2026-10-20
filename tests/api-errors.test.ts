import { describe, expect, it } from "bun:test";
import { readdir } from "bun:fs/promises";
import { join } from "bun:path";

const API_DIR = "app/api";

/** Recursively collect every route.ts under app/api. */
async function routeFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: string[] = [];

  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await routeFiles(full)));
    else if (entry.name === "route.ts") out.push(full);
  }

  return out;
}

const files = await routeFiles(API_DIR);

describe("API error handling", () => {
  it("finds API route files", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("never returns a raw caught error message to the client", async () => {
    const offenders: string[] = [];

    for (const file of files) {
      const source = await Bun.file(file).text();

      // Any `.message` reaching a client-facing `error:` field is a leak,
      // whether it is `error.message` or a `x instanceof Error ? x.message : …`.
      // Also flag a `message` local derived from a caught error, whether it is
      // returned inline or via a multi-line `c.json` / `NextResponse.json`.
      const patterns = [
        /error:\s*[^,}\n]*\.message/,
        /const\s+message\s*=\s*(?:err|error)\s+instanceof\s+Error\s*\?\s*(?:err|error)\.message/,
        /error:\s*message\b/,
      ];

      for (const pattern of patterns) {
        if (pattern.test(source)) {
          offenders.push(`${file} :: ${pattern}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("routes every 500 through a helper that logs the real cause", async () => {
    const source = await Bun.file("lib/api/errors.ts").text();

    // The shared helper is the only sanctioned way to return a 500; it must
    // log server-side, otherwise operators lose the diagnostic entirely.
    // Now uses structured logger which uses console.error internally
    expect(source).toMatch(/console\.(error|warn|log)/);
  });

  it("never emits a 500 response without an accompanying log", async () => {
    const offenders: string[] = [];

    for (const file of files) {
      const source = await Bun.file(file).text();

      // A literal 500 JSON response in a catch block must be preceded by a log
      // in the same block, otherwise failures become invisible.
      // Now uses internalError helper or structured logger
      const blocks = source.split(/\}\s*catch\s*\(?\w*\)?\s*\{/);
      for (const block of blocks.slice(1)) {
        const returnsFiveHundred =
          /NextResponse\.json\(\s*\{\s*error:\s*"/.test(block) && /status:\s*500/.test(block);
        if (returnsFiveHundred && !/internalError|logger\.(error|warn|info)/.test(block)) {
          offenders.push(file);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
