import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const message =
      error instanceof Error ? error.message : "Failed to sync episodes";
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
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemContent = match[1];

    // Extract episode ID from guid or link
    const guidMatch = itemContent.match(/<guid[^>]*>(.*?)<\/guid>/);
    const episodeId = guidMatch?.[1] || "";

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

    const imageMatch = itemContent.match(/<itunes:image href="(.*?)"/);
    const coverUrl = imageMatch?.[1];

    if (audioUrl && episodeId) {
      episodes.push({
        episodeId,
        title,
        audioUrl,
        description,
        pubDate,
        coverUrl,
      });
    }
  }

  return episodes;
}
