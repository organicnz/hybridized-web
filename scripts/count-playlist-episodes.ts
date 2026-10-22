#!/usr/bin/env bun
/**
 * Count the episodes in each band's playlist.
 *
 * Reads `context/public-playlists-bands.md` and scrapes the public Firstory
 * playlist page for every entry. Counts are best-effort: the pages are
 * client-rendered, so a zero usually means "rendered in JS" rather than
 * "empty playlist". Use the `sync-firstory` edge function for exact numbers.
 */
const SOURCE = "context/public-playlists-bands.md";
const DELAY_MS = 300;

export {};

interface Playlist {
  band: string;
  url: string;
}

function parsePlaylists(markdown: string): Playlist[] {
  const playlists: Playlist[] = [];

  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    // "Band Name https://…?playlist=cl…"
    const match = /^(.*?)\s+(https?:\/\/\S+)$/.exec(line);
    if (!match) continue;

    playlists.push({ band: match[1].trim(), url: match[2] });
  }

  return playlists;
}

/** Episode ids look like `cl` + 24 lowercase alphanumerics. */
function countEpisodes(html: string): number {
  const ids = new Set<string>();

  for (const match of html.matchAll(/cl[a-z0-9]{24}/g)) {
    ids.add(match[0]);
  }

  return ids.size;
}

const source = await Bun.file(SOURCE).text();
const playlists = parsePlaylists(source);

console.log("Counting episodes in each band's playlist...");
console.log("");
console.log("Band Name | Episodes");
console.log("----------|----------");

for (const { band, url } of playlists) {
  let count = 0;

  try {
    const response = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; HybridizedBot/1.0)" },
    });
    count = countEpisodes(await response.text());
  } catch (error) {
    console.error(
      `Failed to fetch ${url}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  console.log(`${band.padEnd(20)} | ${count}`);

  // Be polite to the upstream site.
  await Bun.sleep(DELAY_MS);
}

console.log("");
console.log("Note: Counts may be 0 if pages are JavaScript-rendered.");
console.log("Run the sync-firstory edge function for accurate counts.");
