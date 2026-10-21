/**
 * The search endpoint's parameters.
 *
 * They are in a module of their own because the entry point calls
 * `Deno.serve` at module scope, so importing it starts a listener and the
 * logic inside it cannot be reached by a test.
 */

/** The number of results a search returns when the caller does not say. */
export const DEFAULT_LIMIT = 10;

/** The most results a search returns. */
export const MAX_LIMIT = 100;

/**
 * The number of results a search asks for.
 *
 * A limit that is not a number is the default, and every limit is between
 * one and a hundred. The endpoint is public, so a caller must not be able
 * to ask for the whole table — and a limit of `NaN` is not a number the
 * database understands.
 */
export function parseLimit(raw: string | null): number {
  const parsed = Number.parseInt(raw ?? "", 10);

  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_LIMIT;

  return Math.min(parsed, MAX_LIMIT);
}
