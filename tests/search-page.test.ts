import { beforeEach, describe, expect, it, mock } from "bun:test";
import { createElement } from "react";
import { renderToReadableStream } from "react-dom/server";
import { AudioPlayerProvider } from "@/lib/audio-player-context";

/**
 * The search page.
 *
 * The filtering happens in Postgres — the `search_episodes` RPC — and what
 * comes back is mapped into the shape the player reads. That mapping is the
 * part that can be wrong in a way nobody sees: a band that is attached to
 * the wrong episode, or a field that is dropped.
 */

interface SearchRow {
  id: number;
  episode_id: string;
  title: string;
  description: string | null;
  audio_url: string;
  cover_url: string | null;
  duration: number | null;
  pub_date: string | null;
  band_id: number | null;
  link: string | null;
  audio_length: number | null;
  creator: string | null;
  explicit: boolean | null;
  guid: string | null;
  enclosure_type: string | null;
  created_at: string | null;
  band_name: string | null;
  band_cover_url: string | null;
  band_firstory_user_id: string | null;
}

const ROWS: SearchRow[] = [
  {
    id: 10,
    episode_id: "clabc123",
    title: "Alex Hall - DJ Set At Blue Star Lounge Chi",
    description: "A description",
    audio_url: "https://cdn.example/a.mp3",
    cover_url: null,
    duration: 3600,
    pub_date: "2024-01-01T00:00:00Z",
    band_id: 1,
    link: null,
    audio_length: null,
    creator: "Alex Hall",
    explicit: false,
    guid: null,
    enclosure_type: null,
    created_at: null,
    band_name: "The Band",
    band_cover_url: null,
    band_firstory_user_id: null,
  },
  {
    id: 11,
    episode_id: "clunbanded",
    title: "An episode with no band",
    description: null,
    audio_url: "https://cdn.example/b.mp3",
    cover_url: null,
    duration: null,
    pub_date: null,
    band_id: null,
    link: null,
    audio_length: null,
    creator: null,
    explicit: null,
    guid: null,
    enclosure_type: null,
    created_at: null,
    band_name: null,
    band_cover_url: null,
    band_firstory_user_id: null,
  },
];

/** The arguments the page passed to the RPC. */
let rpcArgs: Record<string, unknown> | null = null;
let rpcError: unknown = null;

mock.module("@/lib/supabase/server", () => ({
  createClient: async () => ({
    rpc: async (_name: string, args: Record<string, unknown>) => {
      rpcArgs = args;
      return { data: rpcError ? null : ROWS, error: rpcError };
    },
  }),
}));

const { default: SearchPage } = await import("@/app/search/page");

/** The page's markup. */
async function render(query?: string): Promise<string> {
  // The root layout provides the audio player context; the page is rendered
  // inside it here, the way it is in the app.
  const stream = await renderToReadableStream(
    createElement(
      AudioPlayerProvider,
      null,
      createElement(SearchPage, { searchParams: Promise.resolve({ q: query }) }),
    ),
  );

  return new Response(stream).text();
}

describe("the search page", () => {
  beforeEach(() => {
    rpcArgs = null;
    rpcError = null;
  });

  it("asks the database for the matches", async () => {
    await render("alex hall");

    expect(rpcArgs).toEqual({ search_query: "alex hall", result_limit: 50 });
  });

  it("shows the results", async () => {
    const html = await render("alex hall");

    expect(html).toContain("Alex Hall - DJ Set At Blue Star Lounge Chi");
    expect(html).toContain("Showing results for:");
  });

  it("shows the band an episode belongs to", async () => {
    const html = await render("alex hall");

    // The band's name is in the row, and the page attaches it to the episode.
    expect(html).toContain("The Band");
  });

  it("shows an episode that has no band", async () => {
    const html = await render("alex hall");

    // A row with no band is still a row: the player shows it without one.
    expect(html).toContain("An episode with no band");
  });

  it("asks for nothing without a query", async () => {
    const html = await render();

    expect(rpcArgs).toBeNull();
    expect(html).toContain("Enter a search query to find mixes");
  });

  it("asks for nothing when the query is only spaces", async () => {
    const html = await render("   ");

    expect(rpcArgs).toBeNull();
    expect(html).toContain("Enter a search query to find mixes");
  });

  it("says so when the search fails", async () => {
    rpcError = { message: "boom" };
    const html = await render("alex hall");

    expect(html).toContain("Error loading search results");
    rpcError = null;
  });

  it("has a target for the skip link", async () => {
    const html = await render("alex hall");

    expect(html).toContain('id="main-content"');
  });
});
