import { describe, expect, it, mock } from "bun:test";
import { createElement } from "react";
import { AudioPlayerProvider } from "@/lib/audio-player-context";
import { renderToReadableStream } from "react-dom/server";

/**
 * The artist page.
 *
 * It is the page people land on — the app redirects to the first artist
 * alphabetically — and it does the work of turning the database's rows into
 * what the page shows: the band that matches the slug in the URL, the
 * episodes bucketed by band, and the profile of the artist.
 *
 * A server component renders to a stream, so the markup is read back with
 * `renderToReadableStream` rather than `renderToStaticMarkup`.
 */

interface BandRow {
  id: number;
  name: string;
  description: string | null;
  cover_url: string | null;
  soundcloud_url: string | null;
  iframe_url: string | null;
  firstory_user_id: string | null;
  created_at: string;
}

interface EpisodeRow {
  id: number;
  episode_id: string;
  band_id: number | null;
  title: string;
  description: string | null;
  audio_url: string;
  cover_url: string | null;
  pub_date: string | null;
  duration: number | null;
  audio_length: number | null;
  creator: string | null;
  explicit: boolean | null;
  link: string | null;
  guid: string | null;
  enclosure_type: string | null;
  created_at: string | null;
}

const BANDS: BandRow[] = [
  {
    id: 1,
    name: "Alex Hall",
    description: "The artist bio",
    cover_url: null,
    soundcloud_url: null,
    iframe_url: null,
    firstory_user_id: null,
    created_at: "2024-01-01T00:00:00Z",
  },
];

const EPISODES: EpisodeRow[] = [
  {
    id: 10,
    episode_id: "clabc123",
    band_id: 1,
    title: "Alex Hall - DJ Set At Blue Star Lounge Chi",
    description: "A description",
    audio_url: "https://cdn.example/a.mp3",
    cover_url: null,
    pub_date: "2024-01-01T00:00:00Z",
    duration: 3600,
    audio_length: null,
    creator: "Alex Hall",
    explicit: false,
    link: null,
    guid: null,
    enclosure_type: null,
    created_at: null,
  },
  {
    id: 11,
    episode_id: "clunbanded",
    band_id: null,
    title: "An episode with no band",
    description: null,
    audio_url: "https://cdn.example/b.mp3",
    cover_url: null,
    pub_date: "2024-01-02T00:00:00Z",
    duration: null,
    audio_length: null,
    creator: null,
    explicit: null,
    link: null,
    guid: null,
    enclosure_type: null,
    created_at: null,
  },
];

/** The rows the static client answers with, by table. */
const TABLES: Record<string, unknown[]> = { bands: BANDS, episodes: EPISODES };

/**
 * The static client.
 *
 * A chainable, thenable query builder, the way the SDK's is: the page
 * chains a different set of calls on each query, and awaits the builder.
 */
function staticClient() {
  return {
    from(table: string) {
      const calls: string[] = [];

      const query = new Proxy({} as Record<string, unknown>, {
        get(_target, property) {
          if (property === "then") {
            return (onfulfilled?: (value: unknown) => unknown) =>
              Promise.resolve({ data: TABLES[table] ?? [], error: null }).then(
                onfulfilled as never,
              );
          }
          if (property === "calls") return calls;
          if (typeof property !== "string") return undefined;

          return (...values: unknown[]) => {
            calls.push(property);
            void values;
            return query;
          };
        },
      });

      return query;
    },
  };
}

mock.module("@/lib/supabase/static", () => ({ createStaticClient: staticClient }));

// The navigation module needs the app router, which only exists inside one.
// The nav asks for the router and the page asks for `notFound`, so both are
// replaced with what the test needs.
mock.module("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, replace: () => {}, prefetch: () => {} }),
  usePathname: () => "/home/alex-hall",
  useSearchParams: () => new URLSearchParams(),
  notFound: () => {
    throw new Error("not found");
  },
  redirect: () => {
    throw new Error("redirected");
  },
}));

const { default: ArtistPage, generateMetadata } = await import("@/app/home/[artist]/page");

/** The page's markup. */
async function render(slug = "alex-hall"): Promise<string> {
  // The root layout provides the audio player context; the page is rendered
  // inside it here, the way it is in the app.
  const stream = await renderToReadableStream(
    createElement(
      AudioPlayerProvider,
      null,
      createElement(ArtistPage, { params: Promise.resolve({ artist: slug }) }),
    ),
  );

  return new Response(stream).text();
}

describe("the artist page", () => {
  it("renders the artist", async () => {
    const html = await render();

    expect(html).toContain("Alex Hall");
    expect(html).toContain("The artist bio");
  });

  it("renders the artist's episodes", async () => {
    const html = await render();

    expect(html).toContain("Alex Hall - DJ Set At Blue Star Lounge Chi");
  });

  it("leaves an episode that has no band out", async () => {
    const html = await render();

    // An episode with no band belongs to nobody, and it is not the artist's.
    expect(html).not.toContain("An episode with no band");
  });

  it("has a target for the skip link", async () => {
    const html = await render();

    expect(html).toContain('id="main-content"');
  });

  it("has a title with the artist's name, not the slug", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ artist: "alex-hall" }) });

    expect(metadata.title).toBe("Alex Hall");
    expect(metadata.description).toContain("Alex Hall");
  });

  it("keeps an artist that does not exist out of the index", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ artist: "nobody-here" }),
    });

    // The page answers 404 in the body, but the status was sent with the
    // first chunk, so this is what keeps the page out of an index.
    expect(metadata.title).toBe("Not Found");
    expect(metadata.robots).toEqual({ index: false });
  });

  it("is not found for an artist that does not exist", async () => {
    const html = await render("nobody-here");

    // The page raises `notFound`, and the render carries the error rather
    // than the artist.
    expect(html).not.toContain("The artist bio");
    expect(html).toContain("not found");
  });
});
