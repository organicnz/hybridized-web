import { describe, expect, it } from "bun:test";
import {
  extractAttr,
  extractText,
  matchBandFromTitle,
  validateEpisodeData,
  type Band,
  type EpisodeData,
} from "@/supabase/functions/sync-firstory/parse";

/**
 * The parsing and band matching of the `sync-firstory` edge function.
 *
 * The function itself talks to the database and to Firstory, so its logic
 * lives in a module of its own: that is what makes it testable at all. The
 * cron calls it every six hours, so a change in the matching quietly moves
 * episodes between bands.
 */

const BANDS: Band[] = [
  { id: 1, name: "Alex Hall" },
  { id: 2, name: "Digital Witchcraft" },
  { id: 3, name: "Digital" },
  { id: 4, name: "Benz & MD" },
  { id: 5, name: "Wayoutwest" },
];

describe("extractText", () => {
  const XML = `<item>
    <title><![CDATA[Alex Hall - DJ Set At Blue Star Lounge]]></title>
    <description>  A plain description  </description>
    <itunes:subtitle attr="x">Subtitle</itunes:subtitle>
  </item>`;

  it("reads a CDATA section", () => {
    expect(extractText(XML, "title")).toBe("Alex Hall - DJ Set At Blue Star Lounge");
  });

  it("reads plain text", () => {
    expect(extractText(XML, "description")).toBe("A plain description");
  });

  it("reads a namespaced tag", () => {
    expect(extractText(XML, "itunes:subtitle")).toBe("Subtitle");
  });

  it("returns nothing for a tag that is not there", () => {
    expect(extractText(XML, "author")).toBe("");
  });

  it("returns nothing for an empty document", () => {
    expect(extractText("", "title")).toBe("");
  });

  it("copes with a tag name that is not a valid pattern", () => {
    expect(extractText("<title>Alex Hall</title>", "(")).toBe("");
  });
});

describe("extractAttr", () => {
  const XML = `<enclosure url="https://cdn.example/a.mp3" length="12345" type="audio/mpeg"/>`;

  it("reads an attribute", () => {
    expect(extractAttr(XML, "enclosure", "url")).toBe("https://cdn.example/a.mp3");
    expect(extractAttr(XML, "enclosure", "length")).toBe("12345");
  });

  it("returns nothing for an attribute that is not there", () => {
    expect(extractAttr(XML, "enclosure", "href")).toBe("");
  });

  it("returns nothing for a tag that is not there", () => {
    expect(extractAttr(XML, "image", "url")).toBe("");
  });

  it("copes with an attribute name that is not a valid pattern", () => {
    expect(extractAttr(XML, "enclosure", "(")).toBe("");
  });
});

describe("matchBandFromTitle", () => {
  it("matches the artist name exactly", () => {
    expect(matchBandFromTitle("Alex Hall - DJ Set At Blue Star", BANDS)).toBe(1);
  });

  it("matches when the band name is at the start of the title", () => {
    expect(matchBandFromTitle("Wayoutwest - Live at Rain", BANDS)).toBe(5);
  });

  it("matches a band whose name has a dash in it", () => {
    // The artist name is what is before the first dash, so "J" is the artist
    // of "J-Slyde - Live" — the band is found by the second pass instead.
    const bands: Band[] = [...BANDS, { id: 6, name: "J-Slyde" }];
    expect(matchBandFromTitle("J-Slyde - Live at Rain", bands)).toBe(6);
  });

  it("matches when the band name is inside the artist name", () => {
    expect(matchBandFromTitle("Alex Hall Trio - Live", BANDS)).toBe(1);
  });

  it("prefers the longest band name", () => {
    // Both "Digital Witchcraft" and "Digital" are bands, and the title names
    // the longer one.
    expect(matchBandFromTitle("Digital Witchcraft - Live", BANDS)).toBe(2);
  });

  it("sends Greg Benz to Benz & MD", () => {
    expect(matchBandFromTitle("Greg Benz - Live", BANDS)).toBe(4);
  });

  it("does not send anyone else to Benz & MD", () => {
    expect(matchBandFromTitle("Alex Hall - Live", BANDS)).toBe(1);
  });

  it("matches nothing when no band is named", () => {
    expect(matchBandFromTitle("An Unknown Artist - Live", BANDS)).toBeNull();
  });

  it("matches nothing for an empty title", () => {
    expect(matchBandFromTitle("", BANDS)).toBeNull();
  });

  it("matches nothing when there are no bands", () => {
    expect(matchBandFromTitle("Alex Hall - Live", [])).toBeNull();
  });

  it("ignores the case of the title and the band", () => {
    expect(matchBandFromTitle("alex hall - Live", BANDS)).toBe(1);
    expect(matchBandFromTitle("ALEX HALL - Live", BANDS)).toBe(1);
  });
});

describe("validateEpisodeData", () => {
  const episode: EpisodeData = {
    episode_id: "clabc123",
    guid: "clabc123",
    title: "Alex Hall - DJ Set",
    description: "A description",
    link: "https://open.firstory.me/story/clabc123",
    audio_url: "https://cdn.example/a.mp3",
    audio_length: 123,
    enclosure_type: "audio/mpeg",
    cover_url: null,
    duration: 30,
    pub_date: "Mon, 01 Jan 2024 00:00:00 GMT",
    creator: "Alex Hall",
    explicit: false,
    band_id: null,
  };

  it("accepts a complete episode", () => {
    expect(validateEpisodeData(episode)).toBe(true);
  });

  it("rejects an episode with no id", () => {
    expect(validateEpisodeData({ ...episode, episode_id: "" })).toBe(false);
  });

  it("rejects an episode with no title", () => {
    expect(validateEpisodeData({ ...episode, title: "" })).toBe(false);
  });

  it("rejects an episode with no audio", () => {
    expect(validateEpisodeData({ ...episode, audio_url: "" })).toBe(false);
  });

  it("rejects an audio url that is not a url", () => {
    expect(validateEpisodeData({ ...episode, audio_url: "not-a-url" })).toBe(false);
  });
});
