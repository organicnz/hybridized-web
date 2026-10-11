import { describe, expect, it } from "bun:test";
import { findEpisodeById, parseFeed, parseFeedFull } from "@/lib/api/rss";

const XML = `<rss><channel>
<item>
  <title><![CDATA[Episode One]]></title>
  <description><![CDATA[Desc one]]></description>
  <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
  <guid>ep-1</guid>
  <link>https://open.firstory.me/story/ep-1</link>
  <enclosure url="https://audio.example/1.mp3" type="audio/mpeg"/>
  <itunes:image href="https://img.example/1.jpg"/>
</item>
<item>
  <title>Plain Two</title>
  <description>Desc two</description>
  <pubDate>Tue, 02 Jan 2024 00:00:00 GMT</pubDate>
  <guid>ep-2</guid>
  <link>https://open.firstory.me/story/ep-2</link>
  <enclosure url="https://audio.example/2.mp3"/>
</item>
<item>
  <title>No Audio</title>
  <guid>ep-3</guid>
</item>
</channel></rss>`;

describe("parseFeed", () => {
  it("returns only items with an audio enclosure", () => {
    const episodes = parseFeed(XML);
    expect(episodes).toHaveLength(2);
    expect(episodes[0].audioUrl).toBe("https://audio.example/1.mp3");
  });

  it("strips CDATA wrappers and preserves plain text", () => {
    const [one, two] = parseFeed(XML);
    expect(one.title).toBe("Episode One");
    expect(one.description).toBe("Desc one");
    expect(two.title).toBe("Plain Two");
    expect(two.pubDate).toBe("Tue, 02 Jan 2024 00:00:00 GMT");
  });
});

describe("parseFeedFull", () => {
  it("keeps the guid and cover image for persistence", () => {
    const episodes = parseFeedFull(XML);
    expect(episodes).toHaveLength(2);
    expect(episodes[0].episodeId).toBe("ep-1");
    expect(episodes[0].coverUrl).toBe("https://img.example/1.jpg");
    expect(episodes[1].coverUrl).toBeUndefined();
  });
});

describe("findEpisodeById", () => {
  it("matches on the guid", () => {
    expect(findEpisodeById(XML, "ep-2")?.title).toBe("Plain Two");
  });

  it("matches on a link substring", () => {
    expect(findEpisodeById(XML, "ep-1")?.title).toBe("Episode One");
  });

  it("returns null for an unknown id", () => {
    expect(findEpisodeById(XML, "nope")).toBeNull();
  });
});
