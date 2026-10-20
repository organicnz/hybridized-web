// Shared search constants + query normalization for the /search page.
// Filtering itself runs in Postgres via the `search_episodes` RPC; this
// keeps the client contract (trimmed, length-capped query + fixed limit)
// in one tested place.

export const SEARCH_RESULT_LIMIT = 50;
export const MAX_SEARCH_QUERY_LENGTH = 100;

export function normalizeSearchQuery(query: string): string {
  return query.trim().slice(0, MAX_SEARCH_QUERY_LENGTH);
}
