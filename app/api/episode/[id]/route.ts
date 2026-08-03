import { type NextRequest, NextResponse } from "next/server";

interface Episode {
  title: string;
  audioUrl: string;
  description: string;
  pubDate: string;
}

// Hardcoded Firstory user ID for all Hybridized content
const FIRSTORY_USER_ID = "cl3ps0kge021i01y69qhnf36d";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      return NextResponse.json({ error: "Episode not found in feed" }, { status: 404 });
    }

    return NextResponse.json({ episodes: [episode] });
  } catch (error) {
    console.error("Error fetching episode:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch episode";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function findEpisodeById(xmlText: string, episodeId: string): Episode | null {
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null = itemRegex.exec(xmlText);

  while (match !== null) {
    const itemContent = match[1];
    const guid = itemContent.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1] ?? "";
    const link = itemContent.match(/<link>(.*?)<\/link>/)?.[1] ?? "";

    if (guid.includes(episodeId) || link.includes(episodeId)) {
      const title = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ?? "";
      const audioUrl = itemContent.match(/<enclosure url="(.*?)"/)?.[1] ?? "";
      const description =
        itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ?? "";
      const pubDate = itemContent.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? "";

      if (audioUrl) return { title, audioUrl, description, pubDate };
    }
    match = itemRegex.exec(xmlText);
  }

  return null;
}
