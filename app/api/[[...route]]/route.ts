import { createClient } from "@/lib/supabase/server";
import { Hono } from "hono";
import { handle } from "hono/vercel";

export const runtime = "edge";

const app = new Hono().basePath("/api");

// ─── Episodes ────────────────────────────────────────────────────────────────

app.get("/v2/episodes", async (c) => {
  const bandId = c.req.query("bandId");
  try {
    const supabase = await createClient();
    let query = supabase.from("episodes").select("*").order("pub_date", { ascending: false });

    if (bandId) query = query.eq("band_id", bandId);

    const { data: episodes, error } = await query;
    if (error) throw error;
    return c.json({ episodes: episodes ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch episodes";
    return c.json({ error: message }, 500);
  }
});

// ─── Single Episode ───────────────────────────────────────────────────────────

const FIRSTORY_USER_ID = "cl3ps0kge021i01y69qhnf36d";

app.get("/v2/episode/:id", async (c) => {
  const episodeId = c.req.param("id");
  if (!episodeId) return c.json({ error: "Missing episode ID" }, 400);

  try {
    const feedUrl = `https://feed.firstory.me/rss/user/${FIRSTORY_USER_ID}`;
    const res = await fetch(feedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HybridizedApp/1.0)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      if (res.status === 404) return c.json({ error: "Feed not found" }, 404);
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const xmlText = await res.text();
    const episode = findEpisodeById(xmlText, episodeId);

    if (!episode) return c.json({ error: "Episode not found in feed" }, 404);
    return c.json({ episodes: [episode] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch episode";
    return c.json({ error: message }, 500);
  }
});

// ─── Firstory Feed ───────────────────────────────────────────────────────────

app.get("/v2/firstory-feed", async (c) => {
  const userId = c.req.query("userId");
  if (!userId || !/^[a-zA-Z0-9_-]+$/.test(userId)) {
    return c.json({ error: "Invalid or missing userId" }, 400);
  }

  try {
    const feedUrl = `https://feed.firstory.me/rss/user/${userId}`;
    const res = await fetch(feedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HybridizedApp/1.0)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      if (res.status === 404) return c.json({ error: "User feed not found" }, 404);
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const xmlText = await res.text();
    return c.json({ episodes: parseRSSFeed(xmlText) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch feed";
    return c.json({ error: message }, 500);
  }
});

// ─── Playlist Episodes ───────────────────────────────────────────────────────

app.get("/v2/playlist-episodes", async (c) => {
  const playlistId = c.req.query("playlistId");
  if (!playlistId) return c.json({ error: "playlistId is required" }, 400);

  try {
    const res = await fetch(`https://open.firstory.me/embed/playlists/${playlistId}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HybridizedApp/1.0)" },
    });

    if (!res.ok) throw new Error(`Failed to fetch playlist: ${res.status}`);

    const html = await res.text();
    const episodeIds: string[] = [];
    const storyRegex = /story\/(cl[a-z0-9]+)/g;
    let match: RegExpExecArray | null = storyRegex.exec(html);
    while (match !== null) {
      if (!episodeIds.includes(match[1])) episodeIds.push(match[1]);
      match = storyRegex.exec(html);
    }

    return c.json({ episodeIds });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch playlist";
    return c.json({ error: message }, 500);
  }
});

// ─── Sync Episodes (POST) ────────────────────────────────────────────────────

app.post("/v2/sync-episodes", async (c) => {
  try {
    const supabase = await createClient();
    const feedUrl = `https://feed.firstory.me/rss/user/${FIRSTORY_USER_ID}`;

    const res = await fetch(feedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HybridizedApp/1.0)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });

    if (!res.ok) throw new Error(`Failed to fetch RSS feed: ${res.status}`);

    const xmlText = await res.text();
    const episodes = parseRSSFeedFull(xmlText);

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
        { onConflict: "episode_id" },
      );
      if (!error) insertedCount++;
    }

    return c.json({ success: true, synced: insertedCount, total: episodes.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to sync episodes";
    return c.json({ error: message }, 500);
  }
});

// ─── Sync Playlists (POST) ───────────────────────────────────────────────────

app.post("/v2/sync-playlists", async (c) => {
  try {
    const supabase = await createClient();
    const { data: bands, error: bandsError } = await supabase
      .from("bands")
      .select("id, name, iframe_url")
      .not("iframe_url", "is", null);

    if (bandsError) throw bandsError;

    let totalMatched = 0;
    const results: Array<{ band: string; episodes?: number; error?: string }> = [];

    for (const band of bands ?? []) {
      try {
        const playlistMatch = band.iframe_url?.match(/playlists\/([^/?]+)/);
        if (!playlistMatch) {
          results.push({ band: band.name, error: "Invalid playlist URL" });
          continue;
        }

        const res = await fetch(`https://open.firstory.me/api/playlists/${playlistMatch[1]}`, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; HybridizedApp/1.0)",
            Accept: "application/json",
          },
        });

        if (!res.ok) {
          results.push({ band: band.name, error: `HTTP ${res.status}` });
          continue;
        }

        const playlistData = await res.json();
        const episodeIds = extractEpisodeIdsFromAPI(playlistData);

        if (episodeIds.length === 0) {
          results.push({ band: band.name, episodes: 0 });
          continue;
        }

        const { error: updateError } = await supabase
          .from("episodes")
          .update({ band_id: band.id })
          .in("episode_id", episodeIds);

        if (updateError) {
          results.push({ band: band.name, error: updateError.message });
        } else {
          totalMatched += episodeIds.length;
          results.push({ band: band.name, episodes: episodeIds.length });
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        results.push({ band: band.name, error: message });
      }
    }

    return c.json({ success: true, totalMatched, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to sync playlists";
    return c.json({ error: message }, 500);
  }
});

// ─── Match Episodes (POST) ───────────────────────────────────────────────────

app.post("/v2/match-episodes", async (c) => {
  try {
    const supabase = await createClient();
    const { data: bands, error: bandsError } = await supabase.from("bands").select("id, name");
    if (bandsError) throw bandsError;

    const { data: episodes, error: episodesError } = await supabase
      .from("episodes")
      .select("id, title, episode_id");
    if (episodesError) throw episodesError;

    let matchedCount = 0;

    for (const episode of episodes ?? []) {
      const title = episode.title.toLowerCase();
      for (const band of bands ?? []) {
        const bandName = band.name.toLowerCase();
        let matched = false;

        if (bandName === "wayoutwest" && title.includes("way out west")) {
          matched = true;
        } else if (
          bandName === "benz & md" &&
          (title.includes("benz & md") || title.includes("benz and md"))
        ) {
          matched = true;
        } else if (title.includes(bandName)) {
          matched = true;
        }

        if (matched) {
          const { error } = await supabase
            .from("episodes")
            .update({ band_id: band.id })
            .eq("id", episode.id);
          if (!error) matchedCount++;
          break;
        }
      }
    }

    return c.json({
      success: true,
      matched: matchedCount,
      total: episodes?.length ?? 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to match episodes";
    return c.json({ error: message }, 500);
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface Episode {
  title: string;
  audioUrl: string;
  description: string;
  pubDate: string;
}

function findEpisodeById(xmlText: string, episodeId: string): Episode | null {
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null = itemRegex.exec(xmlText);

  while (match !== null) {
    const item = match[1];
    const guid = item.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1] ?? "";
    const link = item.match(/<link>(.*?)<\/link>/)?.[1] ?? "";

    if (guid.includes(episodeId) || link.includes(episodeId)) {
      const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ?? "";
      const audioUrl = item.match(/<enclosure url="(.*?)"/)?.[1] ?? "";
      const description =
        item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ?? "";
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? "";
      if (audioUrl) return { title, audioUrl, description, pubDate };
    }
    match = itemRegex.exec(xmlText);
  }
  return null;
}

function parseRSSFeed(xmlText: string): Episode[] {
  const episodes: Episode[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null = itemRegex.exec(xmlText);

  while (match !== null) {
    const item = match[1];
    const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ?? "";
    const audioUrl = item.match(/<enclosure url="(.*?)"/)?.[1] ?? "";
    const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ?? "";
    const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? "";
    if (audioUrl) episodes.push({ title, audioUrl, description, pubDate });
    match = itemRegex.exec(xmlText);
  }
  return episodes;
}

function parseRSSFeedFull(xmlText: string) {
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
    const item = match[1];
    const episodeId = item.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1] ?? "";
    const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ?? "";
    const audioUrl = item.match(/<enclosure url="(.*?)"/)?.[1] ?? "";
    const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ?? "";
    const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? "";
    const coverUrl = item.match(/<itunes:image href="(.*?)"/)?.[1];
    if (audioUrl && episodeId) {
      episodes.push({ episodeId, title, audioUrl, description, pubDate, coverUrl });
    }
    match = itemRegex.exec(xmlText);
  }
  return episodes;
}

function extractEpisodeIdsFromAPI(data: unknown): string[] {
  const episodeIds: string[] = [];
  const d = data as Record<string, unknown>;

  const list = (d.episodes as unknown[]) ?? (d.items as unknown[]) ?? (d.data as unknown[]) ?? [];

  if (Array.isArray(list)) {
    for (const item of list) {
      const ep = item as Record<string, unknown>;
      const id = (ep.id ?? ep.episode_id) as string | undefined;
      if (id) episodeIds.push(id);
    }
  }

  return episodeIds;
}

export const GET = handle(app);
export const POST = handle(app);
