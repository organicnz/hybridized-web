import type { Route } from "next";

/**
 * Helpers for building URLs that stay inside Next's typed-route system.
 *
 * With `typedRoutes` enabled, `next/link` and the App Router accept only
 * `Route` — a union of the app's real route paths. A plain `string` is
 * rejected, so a typo in a link is a type error rather than a 404.
 *
 * The one thing the type system cannot express is a route plus a search
 * string or fragment. `Route` does cover `` `${StaticRoutes}${SearchOrHash}` ``,
 * but TypeScript cannot prove that a template literal built from a `Route`
 * union still matches it, so these helpers perform that one narrowing in a
 * single, documented place.
 */

/**
 * Append a query string to a route.
 *
 * The base is always a known route and the suffix always starts with "?", so
 * the result is a valid route by construction.
 */
export function withQuery(route: Route, query: Record<string, string | undefined>): Route {
  const search = new URLSearchParams(
    Object.entries(query).filter((entry): entry is [string, string] => entry[1] !== undefined),
  ).toString();

  return (search ? `${route}?${search}` : route) as Route;
}

/**
 * Append a URL fragment to a route.
 *
 * The base is always a known route and the fragment always starts with "#",
 * so the result is a valid route by construction.
 */
export function withHash(route: Route, hash: string): Route {
  const fragment = hash.startsWith("#") ? hash : "";
  return (fragment ? `${route}${fragment}` : route) as Route;
}
