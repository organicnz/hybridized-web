/**
 * The pure parts of the sync.
 *
 * The parsing and the band matching are where the edge cases live, and they
 * are the parts that can be reasoned about without a database, a network or a
 * running server — so they live here rather than in the entry point, which
 * starts a listener the moment it is imported.
 *
 * Nothing in this file touches the Deno runtime, so it is ordinary
 * TypeScript: the tests for it run with Bun, in the same suite as the rest of
 * the project.
 */

export interface Band {
  id: number;
  name: string;
}

export interface EpisodeData {
  episode_id: string;
  guid: string;
  title: string;
  description: string;
  link: string;
  audio_url: string;
  audio_length: number;
  enclosure_type: string;
  cover_url: string | null;
  duration: number;
  pub_date: string;
  creator: string;
  explicit: boolean;
  band_id: number | null;
}

/** Extract the text of a tag, from a CDATA section or from plain text. */
export function extractText(xml: string, tag: string): string {
  try {
    const cdataMatch = xml.match(
      new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`),
    );
    const cdata = cdataMatch?.[1];
    if (cdata !== undefined) return cdata.trim();

    const textMatch = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`));
    const text = textMatch?.[1];
    return text !== undefined ? text.trim() : "";
  } catch {
    return "";
  }
}

/** Extract an attribute's value from a tag. */
export function extractAttr(xml: string, tag: string, attr: string): string {
  try {
    const match = xml.match(new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`));
    const value = match?.[1];
    return value !== undefined ? value : "";
  } catch {
    return "";
  }
}

/**
 * Find the band an episode belongs to, from its title.
 *
 * The title is "Artist Name - Show Title", and the band is nearly always the
 * artist. Three passes, from the most precise to the least:
 *
 *   1. the artist name is exactly the band name;
 *   2. the band name is at the start of the title;
 *   3. the band name is somewhere in the artist name.
 *
 * The longest band name wins, so "Digital Witchcraft" is preferred over
 * "Digital" when both are bands.
 */
export function matchBandFromTitle(title: string, bands: Band[]): number | null {
  if (!title || !bands || bands.length === 0) return null;

  const titleLower = title.toLowerCase();

  // Extract the artist name from title (format: "Artist Name - Show Title")
  const artistMatch = title.match(/^([^-]+)\s*-/);
  const artistName = artistMatch?.[1]?.trim().toLowerCase() ?? titleLower;

  // Special case: Greg Benz belongs to Benz & MD
  if (artistName.includes("greg benz")) {
    const benzMdBand = bands.find((b) => b.name.toLowerCase() === "benz & md");
    if (benzMdBand) return benzMdBand.id;
  }

  // Sort bands by name length (longest first) for better matching
  const sortedBands = [...bands].sort((a, b) => b.name.length - a.name.length);

  // First pass: exact match on artist name (before the dash)
  for (const band of sortedBands) {
    const bandNameLower = band.name.toLowerCase();
    if (artistName === bandNameLower) {
      return band.id;
    }
  }

  // Second pass: check if band name appears at the start of title
  for (const band of sortedBands) {
    const bandNameLower = band.name.toLowerCase();
    if (titleLower.startsWith(`${bandNameLower} -`) || titleLower.startsWith(`${bandNameLower}-`)) {
      return band.id;
    }
  }

  // Third pass: check if band name appears in artist name portion only
  for (const band of sortedBands) {
    const bandNameLower = band.name.toLowerCase();
    if (artistName.includes(bandNameLower)) {
      return band.id;
    }
  }

  return null;
}

/** Whether an episode has everything the database needs to store it. */
export function validateEpisodeData(data: EpisodeData): boolean {
  return !!(
    data.episode_id &&
    data.title &&
    data.audio_url &&
    data.episode_id.length > 0 &&
    data.title.length > 0 &&
    data.audio_url.startsWith("http")
  );
}
