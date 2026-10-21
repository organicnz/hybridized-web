import { describe, expect, it } from "bun:test";
import { mkdtemp } from "bun:fs/promises";
import { tmpdir } from "bun:os";
import { join } from "bun:path";
import { readFloor } from "@/scripts/lib/coverage";

/**
 * The coverage floor, read from the configuration.
 *
 * The floor is in `bunfig.toml` so there is one place to look for it, and
 * the README quotes it — so the reader of both has to be the same one.
 */

describe("readFloor", () => {
  it("reads the floor the project declares", async () => {
    const floor = await readFloor(".");

    // The number itself moves; the shape of it does not.
    expect(floor.lines).toBeGreaterThan(0.5);
    expect(floor.lines).toBeLessThanOrEqual(1);
    expect(floor.functions).toBe(floor.lines);
  });

  it("falls back to the default when there is no configuration", async () => {
    const dir = await mkdtemp(join(tmpdir(), "coverage-floor-"));

    expect(await readFloor(dir)).toEqual({ lines: 0.8, functions: 0.8 });
  });

  it("falls back to the default when the configuration cannot be parsed", async () => {
    const dir = await mkdtemp(join(tmpdir(), "coverage-floor-"));
    await Bun.write(join(dir, "bunfig.toml"), "this is not toml [[[");

    expect(await readFloor(dir)).toEqual({ lines: 0.8, functions: 0.8 });
  });
});
