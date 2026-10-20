/**
 * RSS/Atom parsing for the Firstory feeds.
 *
 * Uses Bun's native XML processor (`Bun.XML`) instead of a hand-rolled regex
 * scanner: CDATA, entities, self-closing tags, namespaced tags and repeated
 * elements are all handled by the runtime, so there is no dependency and no
 * regular expression to maintain.
 *
 * `Bun.XML` returns a compact tree:
 * - an element with only character data becomes a string,
 * - an element with children becomes an object keyed by tag name,
 * - repeated elements become an array,
 * - attributes are prefixed with `@`, mixed content text lives under `#text`.
 */

/** The named entities XML 1.0 predefines. */
const PREDEFINED_ENTITIES = new Set(["amp", "lt", "gt", "quot", "apos"]);

/**
 * HTML entities that turn up in real-world feeds. Anything else that is not
 * predefined by XML is neutralised, because a conforming XML processor
 * rejects undeclared entities outright.
 */
const HTML_ENTITIES: Record<string, string> = {
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  bull: "•",
  middot: "·",
  copy: "©",
  reg: "®",
  trade: "™",
  eacute: "é",
  egrave: "è",
  agrave: "à",
  ccedil: "ç",
  szlig: "ß",
  uuml: "ü",
  ouml: "ö",
  auml: "ä",
};

/** A parsed element: either its character data or a map of child elements. */
type XmlNode = string | Record<string, unknown>;

function asNode(value: unknown): XmlNode | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null) return value as Record<string, unknown>;
  return undefined;
}

/** Every child element named `name`; the runtime collapses or arrays repeats. */
function children(parent: XmlNode | undefined, name: string): XmlNode[] {
  if (parent === undefined || typeof parent === "string") return [];

  const value = parent[name];
  if (value === undefined) return [];

  const list = Array.isArray(value) ? value : [value];
  const nodes: XmlNode[] = [];
  for (const entry of list) {
    const node = asNode(entry);
    if (node !== undefined) nodes.push(node);
  }
  return nodes;
}

/** Character data of the first child named `name`, or "" when absent. */
function text(parent: XmlNode | undefined, name: string): string {
  const child = children(parent, name)[0];
  if (child === undefined) return "";
  if (typeof child === "string") return child;

  // Mixed content (`<guid isPermaLink="false">ep-1</guid>`) keeps the text
  // under `#text`.
  const mixed = child["#text"];
  return typeof mixed === "string" ? mixed : "";
}

/** Attribute `name` of `parent`, or "" when absent. */
function attribute(parent: XmlNode | undefined, name: string): string {
  if (parent === undefined || typeof parent === "string") return "";
  const value = parent[`@${name}`];
  return typeof value === "string" ? value : "";
}

/**
 * Replace named entities that XML does not predefine with a space, leaving
 * CDATA blocks and the predefined entities untouched.
 */
function neutralizeUnknownEntities(xml: string): string {
  return xml.replace(
    /<!\[CDATA\[[\s\S]*?\]\]>|&([a-zA-Z][a-zA-Z0-9]*);/g,
    (match, name: string | undefined) => {
      if (name === undefined) return match; // CDATA block — keep verbatim
      if (PREDEFINED_ENTITIES.has(name)) return match;
      return HTML_ENTITIES[name] ?? " ";
    },
  );
}

/**
 * Parse a document, retrying with undeclared entities neutralised.
 *
 * The fast path is the plain parse; the retry only runs for feeds that are
 * not well-formed XML, so a stray HTML entity degrades to a sanitised parse
 * rather than to zero episodes.
 */
function parseDocument(xml: string): XmlNode | undefined {
  try {
    return asNode(Bun.XML.parse(xml));
  } catch {
    try {
      return asNode(Bun.XML.parse(neutralizeUnknownEntities(xml)));
    } catch {
      return undefined;
    }
  }
}

/** The `<item>` (RSS) or `<entry>` (Atom) elements of a feed document. */
function items(xml: string): XmlNode[] {
  const document = parseDocument(xml);
  if (document === undefined) return [];

  const root = children(document, "rss")[0] ?? children(document, "feed")[0] ?? document;
  const channel = children(root, "channel")[0] ?? root;

  return [...children(channel, "item"), ...children(channel, "entry")];
}

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

function toEpisode(item: XmlNode): RssEpisode {
  return {
    title: text(item, "title"),
    audioUrl: attribute(children(item, "enclosure")[0], "url"),
    description: text(item, "description"),
    pubDate: text(item, "pubDate"),
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
    const episodeId = text(item, "guid");
    const episode = toEpisode(item);
    if (!episode.audioUrl || !episodeId) continue;
    const coverUrl = attribute(children(item, "itunes:image")[0], "href");
    episodes.push({ ...episode, episodeId, ...(coverUrl ? { coverUrl } : {}) });
  }
  return episodes;
}

/** Find a single episode by GUID or `<link>` containing the given id. */
export function findEpisodeById(xml: string, episodeId: string): RssEpisode | null {
  for (const item of items(xml)) {
    const guid = text(item, "guid");
    const link = text(item, "link");
    if (!guid.includes(episodeId) && !link.includes(episodeId)) continue;
    const episode = toEpisode(item);
    if (episode.audioUrl) return episode;
  }
  return null;
}
