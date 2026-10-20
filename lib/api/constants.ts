/** Hardcoded Firstory user ID for all Hybridized content. */
export const FIRSTORY_USER_ID = "cl3ps0kge021i01y69qhnf36d";

export const FIRSTORY_FEED_URL = `https://feed.firstory.me/rss/user/${FIRSTORY_USER_ID}`;

export const FIRSTORY_USER_AGENT = "Mozilla/5.0 (compatible; HybridizedApp/1.0)";

export const RSS_ACCEPT = "application/rss+xml, application/xml, text/xml, */*";

/** Shared CDN cache policies for API responses. */
export const CACHE_SHORT = "s-maxage=60, stale-while-revalidate=300";
export const CACHE_MEDIUM = "s-maxage=300, stale-while-revalidate=600";

/** Upstream fetch timeout for Firstory requests. */
export const UPSTREAM_TIMEOUT_MS = 10_000;
