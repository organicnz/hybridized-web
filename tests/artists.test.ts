import { beforeEach, describe, expect, it, mock } from "bun:test";
import { findArtistBySlug } from "@/lib/artists";

/**
 * Finding an artist by its slug.
 *
 * The slug is derived from the name, so it is not reversible: the bands are
 * read and the names are compared. That is what the artist's page does to
 * decide which artist a URL is about — and what its title comes from.
 */

const BANDS = [
  { id: 1, name: "Alex Hall" },
  { id: 2, name: "Benz & MD" },
  { id: 3, name: null },
];

mock.module("@/lib/supabase/static", () => ({
  createStaticClient: () => ({
    from: () => {
      // A chainable, thenable query builder, the way the SDK's is.
      const query = new Proxy({} as Record<string, unknown>, {
        get(_target, property) {
          if (property === "then") {
            return (onfulfilled?: (value: unknown) => unknown) =>
              Promise.resolve({ data: BANDS, error: null }).then(onfulfilled as never);
          }
          if (typeof property !== "string") return undefined;
          return () => query;
        },
      });

      return query;
    },
  }),
}));

describe("findArtistBySlug", () => {
  beforeEach(() => {
    BANDS[0] = { id: 1, name: "Alex Hall" };
  });

  it("finds an artist by its slug", async () => {
    expect(await findArtistBySlug("alex-hall")).toEqual({ id: 1, name: "Alex Hall" });
  });

  it("finds an artist whose name needs slugging", async () => {
    // The slug keeps the ampersand, and the URL carries it encoded.
    expect(await findArtistBySlug("benz-&-md")).toEqual({ id: 2, name: "Benz & MD" });
  });

  it("is null for a slug that belongs to nobody", async () => {
    expect(await findArtistBySlug("nobody-here")).toBeNull();
  });

  it("is null when the band has no name", async () => {
    // A band with no name has no slug, so it cannot be found by one.
    expect(await findArtistBySlug("")).toBeNull();
  });
});
