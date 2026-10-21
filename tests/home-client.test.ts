import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HomeClient } from "@/app/home/home-client";
import { AudioPlayerProvider } from "@/lib/audio-player-context";
import type { Database } from "@/lib/types/database.types";

/**
 * The artist page's scroll structure.
 *
 * The sets list and the artist profile each scroll inside their own panel,
 * not with the page: on a desktop the panel is a fixed-height region, so
 * each side needs `min-h-0` to be allowed to shrink and scroll. Without it
 * the flex chain below cannot scroll and the content is clipped instead of
 * reachable — which is exactly what was wrong, and it is invisible in a
 * screenshot of a short list.
 *
 * The components render on the server, so the markup can be read back
 * without a browser. The behaviour that needs one — the scrolling itself —
 * is not what is under test here; the structure that makes it possible is.
 */

type Episode = Database["public"]["Tables"]["episodes"]["Row"];
type Band = Database["public"]["Tables"]["bands"]["Row"];

const EPISODE: Episode = {
  id: 10,
  episode_id: "clabc123",
  band_id: 1,
  title: "Alex Hall - DJ Set At Blue Star Lounge Chi",
  description: "A description",
  audio_url: "https://cdn.example/a.mp3",
  cover_url: null,
  pub_date: "2024-01-01T00:00:00Z",
  duration: null,
  audio_length: null,
  creator: "Alex Hall",
  explicit: false,
  link: "https://open.firstory.me/story/clabc123",
  guid: "clabc123",
  enclosure_type: "audio/mpeg",
  created_at: "2024-01-01T00:00:00Z",
};

const BAND: Band = {
  id: 1,
  id_new: null,
  name: "Alex Hall",
  description: "The artist bio",
  formula: null,
  iframe_url: null,
  cover_url: null,
  soundcloud_url: null,
  firstory_user_id: null,
  other: null,
  created_at: "2024-01-01T00:00:00Z",
};

/** The artist page's content, rendered to markup. */
function render(options: { episodes?: Episode[]; soundcloudUrl?: string } = {}): string {
  const { episodes = [EPISODE], soundcloudUrl } = options;

  return renderToStaticMarkup(
    createElement(
      AudioPlayerProvider,
      null,
      createElement(HomeClient, {
        items: [{ ...BAND, episodes }],
        currentArtist: "Alex Hall",
        artistBio: "The artist bio",
        soundcloudUrl,
      }),
    ),
  );
}

/** The element that opens at `start`, and everything inside it. */
function elementFrom(html: string, start: number): string {
  const rest = html.slice(start);
  const name = /^<\s*([a-zA-Z0-9]+)/.exec(rest)?.[1];
  if (!name) return rest;

  const open = new RegExp(`<${name}\\b`, "g");
  const close = new RegExp(`</${name}>`, "g");
  let depth = 0;
  let index = 0;

  while (index < rest.length) {
    open.lastIndex = index;
    close.lastIndex = index;
    const nextOpen = open.exec(rest);
    const nextClose = close.exec(rest);
    if (!nextClose) break;

    if (nextOpen && nextOpen.index < nextClose.index) {
      depth++;
      index = nextOpen.index + 1;
      continue;
    }

    depth--;
    index = nextClose.index + 1;
    if (depth === 0) return rest.slice(0, index);
  }

  return rest;
}

/** The first element of that tag whose class has every one of those classes. */
function findElement(html: string, tag: string, ...classes: string[]): string {
  const pattern = new RegExp(`<${tag} class="([^"]*)"`, "g");
  for (const match of html.matchAll(pattern)) {
    if (classes.every((name) => match[1].includes(name))) return elementFrom(html, match.index);
  }
  return "";
}

describe("the sets list", () => {
  it("renders the episodes", () => {
    const html = render();

    expect(html).toContain("Latest episodes");
    expect(html).toContain(EPISODE.title);
    expect(html).toContain("Alex Hall");
  });

  it("scrolls inside its own panel", () => {
    const html = render();
    // `overflow-y-auto` is the scroll, and `min-h-0` is what lets the panel
    // shrink far enough for the scroll to mean anything.
    const panel = findElement(html, "div", "scrollbar-thin", "overflow-y-auto", "min-h-0");

    expect(panel).not.toBe("");
    expect(panel).toContain(EPISODE.title);
  });

  it("is not inside the artist profile", () => {
    const html = render();
    const profile = findElement(html, "aside", "overflow-y-auto");

    expect(profile).not.toBe("");
    expect(profile).not.toContain(EPISODE.title);
  });

  it("shows a placeholder when there are no episodes", () => {
    const html = render({ episodes: [] });

    expect(html).toContain("No episodes yet");
  });

  it("shows no duration when the episode has none", () => {
    const html = render();

    expect(html).not.toContain("NaN");
  });
});

describe("the artist profile", () => {
  it("scrolls inside its own panel", () => {
    const html = render();
    const panel = findElement(html, "aside", "overflow-y-auto", "h-full");

    expect(panel).not.toBe("");
  });

  it("holds the artist bio", () => {
    const html = render();
    const panel = findElement(html, "aside", "overflow-y-auto");

    expect(panel).toContain("The artist bio");
  });
});

describe("the SoundCloud player", () => {
  it("takes the place of the sets list when there are no episodes", () => {
    const html = render({ episodes: [], soundcloudUrl: "https://soundcloud.com/alex-hall" });

    expect(html).toContain("soundcloud");
    expect(html).not.toContain("Latest episodes");
  });

  it("gives way to the sets list when there are episodes", () => {
    const html = render({ soundcloudUrl: "https://soundcloud.com/alex-hall" });

    expect(html).toContain("Latest episodes");
    expect(html).toContain(EPISODE.title);
  });
});
