/**
 * The coverage floor, read from `bunfig.toml`.
 *
 * The floor is declared in the configuration rather than in the script, so
 * there is one place to look for it — and so the documentation can quote it
 * without the two drifting apart.
 */

/** The floor, as fractions of the total. */
export interface Floor {
  lines: number;
  functions: number;
}

/** The floor declared in `bunfig.toml`, or the default when it is missing. */
export async function readFloor(repoRoot: string): Promise<Floor> {
  const config = await Bun.file(`${repoRoot}/bunfig.toml`)
    .text()
    .catch(() => "");

  let parsed: { test?: { coverageFloor?: Partial<Floor> } } = {};
  try {
    parsed = Bun.TOML.parse(config) as typeof parsed;
  } catch {
    parsed = {};
  }

  const floor = parsed.test?.coverageFloor ?? {};

  return { lines: floor.lines ?? 0.8, functions: floor.functions ?? 0.8 };
}
