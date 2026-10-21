import { describe, expect, it } from "bun:test";
import { existsSync } from "bun:fs";
import { join } from "bun:path";
import { NAV_LINKS } from "@/lib/constants/navigation";
import { withHash, withQuery } from "@/lib/utils/route";

/**
 * The route helpers, and the links in the header.
 *
 * `withQuery` and `withHash` exist because `typedRoutes` makes `Route` a union
 * of the app's real paths, and a route plus a search string is the one thing
 * the type system cannot express. The narrowing lives in one place, so it
 * wants a test.
 */

describe("withQuery", () => {
  it("appends the query", () => {
    expect(withQuery("/home", { q: "alex hall" })).toBe("/home?q=alex+hall");
  });

  it("drops a value that is not there", () => {
    expect(withQuery("/home", { q: "alex", page: undefined })).toBe("/home?q=alex");
  });

  it("returns the route when there is nothing to append", () => {
    expect(withQuery("/home", {})).toBe("/home");
    expect(withQuery("/home", { page: undefined })).toBe("/home");
  });

  it("encodes what it appends", () => {
    expect(withQuery("/home", { q: "a&b=c" })).toBe("/home?q=a%26b%3Dc");
  });
});

describe("withHash", () => {
  it("appends the fragment", () => {
    expect(withHash("/home", "#latest")).toBe("/home#latest");
  });

  it("drops a fragment that has no hash in it", () => {
    // The result has to be a route the type system accepts, and only a
    // fragment that starts with "#" is one.
    expect(withHash("/home", "latest")).toBe("/home");
  });

  it("returns the route when there is nothing to append", () => {
    expect(withHash("/home", "")).toBe("/home");
  });
});

describe("the header links", () => {
  it("every link points at a route that exists", () => {
    const missing = NAV_LINKS.filter((link) => !existsSync(join("app", link.href, "page.tsx")));

    expect(missing.map((link) => link.href)).toEqual([]);
  });

  it("every link has a label", () => {
    expect(NAV_LINKS.every((link) => link.label.length > 0)).toBe(true);
  });

  it("the donation link is the highlighted one", () => {
    const highlighted = NAV_LINKS.filter((link) => "highlight" in link && link.highlight);

    expect(highlighted.map((link) => link.href)).toEqual(["/donation"]);
  });
});
