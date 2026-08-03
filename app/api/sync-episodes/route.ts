import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createClient();

    // Fetch RSS feed
    const userId = "cl3ps0kge021i01y69qhnf36d";
    const feedUrl = `https://feed.firstory.me/rss/user/${userId}`;

    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HybridizedApp/1.0)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status}`);
    }

    const xmlText = await response.text();
    const episodes = parseRSSFeed(xmlText);

    // Insert episodes into database (upsert to avoid duplicates)
    let insertedCount = 0;
    for (const episode of episodes) {
      const { error } = await supabase.from("episodes").upsert(
        {
          episode_id: episode.episodeId,
          title: episode.title,
          description: episode.description,
          audio_url: episode.audioUrl,
          cover_url: episode.coverUrl,
          pub_date: episode.pubDate,
        },
        {
          onConflict: "episode_id",
        },
      );

      if (!error) insertedCount++;
    }

    return NextResponse.json({
      success: true,
      synced: insertedCount,
      total: episodes.length,
    });
  } catch (error) {
    console.error("Error syncing episodes:", error);
    const message = error instanceof Error ? error.message : "Failed to sync episodes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function parseRSSFeed(xmlText: string) {
  const episodes: Array<{
    episodeId: string;
    title: string;
    audioUrl: string;
    description: string;
    pubDate: string;
    coverUrl?: string;
  }> = [];

  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null = itemRegex.exec(xmlText);

  while (match !== null) {
    const itemContent = match[1];
    const episodeId = itemContent.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1] ?? "";
    const title = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ?? "";
    const audioUrl = itemContent.match(/<enclosure url="(.*?)"/)?.[1] ?? "";
    const description =
      itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ?? "";
    const pubDate = itemContent.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? "";
    const coverUrl = itemContent.match(/<itunes:image href="(.*?)"/)?.[1];

    if (audioUrl && episodeId) {
      episodes.push({ episodeId, title, audioUrl, description, pubDate, coverUrl });
    }
    match = itemRegex.exec(xmlText);
  }

  return episodes;
}
