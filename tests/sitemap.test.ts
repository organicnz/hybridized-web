import { beforeEach, describe, expect, it, mock } from "bun:test";
import { slugify } from "@/lib/utils/slug";

/**
 * The sitemap.
 *
 * It lists the static pages and the artists, and the artist URLs have to be
 * the ones the artist page answers to — a slug the page does not match is a
 * 404 in the sitemap, and a search engine is the one place that takes it
 * seriously.
 */

let bands: Array<{ name: string | null }> = [{ name: "Alex Hall" }, { name: "Benz & MD" }];
let databaseFails = false;

mock.module("@/lib/supabase/static", () => ({
  createStaticClient: () => ({
    from: () => ({
      select: () => ({
        order: async () => {
          if (databaseFails) throw new Error("boom");
          return { data: bands, error: null };
        },
      }),
    }),
  }),
}));

const { default: sitemap } = await import("@/app/sitemap");

beforeEach(() => {
  bands = [{ name: "Alex Hall" }, { name: "Benz & MD" }];
  databaseFails = false;
});

describe("the sitemap", () => {
  it("lists the static pages", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toContain("https://hybridized.online");
    expect(urls).toContain("https://hybridized.online/about");
    expect(urls).toContain("https://hybridized.online/home");
  });

  it("lists the artists", async () => {
    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toContain("https://hybridized.online/home/alex-hall");
  });

  it("lists an artist under a slug the artist page can match", async () => {
    const entries = await sitemap();
    const artist = entries.find((entry) => entry.url.includes("benz"));

    // The page decodes the slug and matches it against the band's, so the
    // two have to agree.
    const slug = decodeURIComponent((artist?.url ?? "").split("/home/")[1] ?? "");
    expect(slugify("Benz & MD")).toBe(slug);
  });

  it("leaves out a band with no name", async () => {
    bands = [{ name: null }, { name: "Alex Hall" }];

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls.filter((url) => url.includes("/home/")).length).toBe(1);
  });

  it("falls back to the static pages when the database is down", async () => {
    databaseFails = true;

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toContain("https://hybridized.online/about");
    // The artists are gone, and the static pages are still there.
    expect(urls.filter((url) => url.includes("/home/")).length).toBe(0);
  });
});
