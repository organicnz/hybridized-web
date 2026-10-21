import { beforeEach, describe, expect, it, mock } from "bun:test";
import { createElement } from "react";
import { renderToReadableStream } from "react-dom/server";
import { slugify } from "@/lib/utils/slug";

/**
 * The home route.
 *
 * It is a redirect: the site opens on the first artist alphabetically, with
 * no hardcoded default band. A slug that is wrong is a 404, so the redirect
 * is pinned down here.
 */

const BANDS = [{ name: "Alex Hall" }, { name: "Burufunk" }];

let bands: Array<{ name: string }> = BANDS;
let redirectedTo: string | null = null;

mock.module("@/lib/supabase/static", () => ({
  createStaticClient: () => ({
    from: (table: string) => ({
      select: () => ({
        order: () => ({
          limit: async () => ({ data: table === "bands" ? bands : [], error: null }),
        }),
      }),
    }),
  }),
}));

mock.module("next/navigation", () => ({
  redirect: (to: string) => {
    redirectedTo = to;
  },
  notFound: () => {
    throw new Error("not found");
  },
}));

const { default: HomePage } = await import("@/app/home/page");

/** The page's markup, which is a redirect. */
async function render(): Promise<string> {
  const stream = await renderToReadableStream(createElement(HomePage));

  return new Response(stream).text();
}

describe("the home route", () => {
  beforeEach(() => {
    bands = BANDS;
    redirectedTo = null;
  });

  it("redirects to the first artist", async () => {
    await render();

    expect(redirectedTo).toBe("/home/alex-hall");
  });

  it("slugifies a name that needs it", async () => {
    bands = [{ name: "Benz & MD" }];

    await render();

    expect(redirectedTo).toBe("/home/benz-%26-md");
  });

  it("redirects to a slug the artist page can match", async () => {
    bands = [{ name: "Benz & MD" }];

    await render();

    // The page it lands on decodes the slug and matches it against the
    // band's, so the two have to agree.
    const artist = decodeURIComponent((redirectedTo ?? "").replace("/home/", ""));
    expect(slugify("Benz & MD")).toBe(artist);
  });

  it("is not found when there are no artists", async () => {
    bands = [];

    const html = await render();

    expect(redirectedTo).toBeNull();
    expect(html).toContain("not found");
  });
});
