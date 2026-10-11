/**
 * Minimal RSS/Atom parsing for the Firstory feeds.
 *
 * The upstream feeds are simple enough that a dependency is not warranted; the
 * helper centralises the regexes previously copy-pasted across three routes and
 * tolerates both CDATA-wrapped and plain-text element bodies.
 */

export interface RssEpisode {
  title: string;
  audioUrl: string;
  description: string;
  pubDate: string;
}

export interface RssEpisodeFull extends RssEpisode {
  episodeId: string;
  coverUrl?: string;
}

const ITEM_REGEX = /<item>([\s\S]*?)<\/item>/g;

function items(xml: string): string[] {
  const out: string[] = [];
  let match = ITEM_REGEX.exec(xml);
  while (match !== null) {
    out.push(match[1]);
    match = ITEM_REGEX.exec(xml);
  }
  ITEM_REGEX.lastIndex = 0;
  return out;
}

function extractTag(item: string, name: string): string {
  const cdata = item.match(new RegExp(`<${name}[^>]*><!\\[CDATA\\[(.*?)\\]\\]></${name}>`, "s"));
  if (cdata) return cdata[1];
  const plain = item.match(new RegExp(`<${name}[^>]*>(.*?)</${name}>`, "s"));
  return plain?.[1] ?? "";
}

function extractAttr(item: string, tag: string, attr: string): string {
  return item.match(new RegExp(`<${tag}[^>]*\\b${attr}="([^"]*)"`))?.[1] ?? "";
}

function toEpisode(item: string): RssEpisode {
  return {
    title: extractTag(item, "title"),
    audioUrl: extractAttr(item, "enclosure", "url"),
    description: extractTag(item, "description"),
    pubDate: extractTag(item, "pubDate"),
  };
}

/** Parse every `<item>` with an audio enclosure in an RSS document. */
export function parseFeed(xml: string): RssEpisode[] {
  const episodes: RssEpisode[] = [];
  for (const item of items(xml)) {
    const episode = toEpisode(item);
    if (episode.audioUrl) episodes.push(episode);
  }
  return episodes;
}

/** Like {@link parseFeed} but keeps the GUID and cover image for persistence. */
export function parseFeedFull(xml: string): RssEpisodeFull[] {
  const episodes: RssEpisodeFull[] = [];
  for (const item of items(xml)) {
    const episodeId = extractTag(item, "guid");
    const episode = toEpisode(item);
    if (!episode.audioUrl || !episodeId) continue;
    const coverUrl = extractAttr(item, "itunes:image", "href");
    episodes.push({ ...episode, episodeId, ...(coverUrl ? { coverUrl } : {}) });
  }
  return episodes;
}

/** Find a single episode by GUID or `<link>` containing the given id. */
export function findEpisodeById(xml: string, episodeId: string): RssEpisode | null {
  for (const item of items(xml)) {
    const guid = extractTag(item, "guid");
    const link = extractTag(item, "link");
    if (!guid.includes(episodeId) && !link.includes(episodeId)) continue;
    const episode = toEpisode(item);
    if (episode.audioUrl) return episode;
  }
  return null;
}
