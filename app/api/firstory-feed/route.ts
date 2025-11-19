import { NextRequest, NextResponse } from "next/server";

interface Episode {
  title: string;
  audioUrl: string;
  description: string;
  pubDate: string;
}

function isValidUserId(userId: string): boolean {
  // Only allow alphanumeric, hyphens, and underscores
  return /^[a-zA-Z0-9_-]+$/.test(userId);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");

  if (!userId || !isValidUserId(userId)) {
    return NextResponse.json(
      { error: "Invalid or missing userId" },
      { status: 400 },
    );
  }

  try {
    const feedUrl = `https://feed.firstory.me/rss/user/${userId}`;
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HybridizedApp/1.0)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "User feed not found" },
          { status: 404 },
        );
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xmlText = await response.text();
    const episodes = parseRSSFeed(xmlText);

    return NextResponse.json({ episodes });
  } catch (error) {
    console.error("Error fetching Firstory feed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch feed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function parseRSSFeed(xmlText: string): Episode[] {
  const episodes: Episode[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemContent = match[1];

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
      episodes.push({ title, audioUrl, description, pubDate });
    }
  }

  return episodes;
}
