import { NextRequest, NextResponse } from "next/server";

interface Episode {
  title: string;
  audioUrl: string;
  description: string;
  pubDate: string;
}

// Hardcoded Firstory user ID for all Hybridized content
const FIRSTORY_USER_ID = "cl3ps0kge021i01y69qhnf36d";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: episodeId } = await params;

  if (!episodeId) {
    return NextResponse.json({ error: "Missing episode ID" }, { status: 400 });
  }

  try {
    // Fetch the RSS feed
    const feedUrl = `https://feed.firstory.me/rss/user/${FIRSTORY_USER_ID}`;
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HybridizedApp/1.0)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Feed not found" }, { status: 404 });
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xmlText = await response.text();
    const episode = findEpisodeById(xmlText, episodeId);

    if (!episode) {
      return NextResponse.json(
        { error: "Episode not found in feed" },
        { status: 404 },
      );
    }

    return NextResponse.json({ episodes: [episode] });
  } catch (error) {
    console.error("Error fetching episode:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch episode";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function findEpisodeById(xmlText: string, episodeId: string): Episode | null {
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemContent = match[1];

    // Check if this item contains the episode ID in its guid or link
    const guidMatch = itemContent.match(/<guid[^>]*>(.*?)<\/guid>/);
    const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);

    const guid = guidMatch?.[1] || "";
    const link = linkMatch?.[1] || "";

    // Check if episode ID is in guid or link
    if (guid.includes(episodeId) || link.includes(episodeId)) {
      const titleMatch = itemContent.match(
        /<title><!\[CDATA\[(.*?)\]\]><\/title>/,
      );
      const title = titleMatch?.[1] || "";

      const enclosureMatch = itemContent.match(/<enclosure url="(.*?)"/);
      const audioUrl = enclosureMatch?.[1] || "";

      const descMatch = itemContent.match(
        /<description><!\[CDATA\[(.*?)\]\]><\/description>/,
      );
      const description = descMatch?.[1] || "";

      const dateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
      const pubDate = dateMatch?.[1] || "";

      if (audioUrl) {
        return { title, audioUrl, description, pubDate };
      }
    }
  }

  return null;
}
