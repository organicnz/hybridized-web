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
