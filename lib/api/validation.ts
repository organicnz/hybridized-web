/**
 * Tiny, dependency-free request validation helpers.
 *
 * The app has a handful of query/param inputs; keeping validation local avoids
 * pulling a schema library in for what amounts to a few regexes and coercions.
 */

/** Firstory user/playlist IDs are URL-safe slugs. */
export function isValidSlug(value: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(value);
}

/**
 * A whole number from a query parameter, clamped to a range.
 *
 * A value that is not a number is the default, and the result is always
 * inside the range. The clamping alone is not enough: `Math.max(NaN, 1)` is
 * `NaN`, so a limit of "abc" would reach the database as `NaN` and the
 * query would be nonsense.
 */
export function clampInteger(
  raw: string | null | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;

  return Math.min(Math.max(parsed, min), max);
}

export interface QueryResult {
  ok: boolean;
  value: string;
  error?: string;
}

/** Read a required, slug-shaped query parameter. */
export function requiredSlug(params: URLSearchParams, key: string, label = key): QueryResult {
  const raw = params.get(key);
  if (!raw) return { ok: false, value: "", error: `Missing ${label}` };
  if (!isValidSlug(raw)) return { ok: false, value: "", error: `Invalid ${label}` };
  return { ok: true, value: raw };
}
