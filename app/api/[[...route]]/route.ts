import { isSyncAuthorized } from "@/lib/api/auth";
import {
  CACHE_MEDIUM,
  CACHE_SHORT,
  FIRSTORY_FEED_URL,
  FIRSTORY_USER_AGENT,
  RSS_ACCEPT,
  UPSTREAM_TIMEOUT_MS,
} from "@/lib/api/constants";
import { generateRequestId, logger, toError } from "@/lib/api/errors";
import { findEpisodeById, parseFeed, parseFeedFull } from "@/lib/api/rss";
import { clampInteger, isValidSlug } from "@/lib/api/validation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { Hono } from "hono";
import { handle } from "hono/vercel";

type Variables = {
  requestId: string;
  path: string;
  method: string;
};

const app = new Hono<{ Variables: Variables }>().basePath("/api");

// ─── Middleware ──────────────────────────────────────────────────────────────

app.use("/v1/*", async (c, next) => {
  const requestId = generateRequestId();
  const path = c.req.path;
  const method = c.req.method;
  c.set("requestId", requestId);
  c.set("path", path);
  c.set("method", method);

  const startedAt = Date.now();
  logger.info(`request.start ${path}`, { requestId, path, method });

  await next();

  logger.info(`request.end ${path}`, {
    requestId,
    path,
    method,
    statusCode: c.res.status,
    durationMs: Date.now() - startedAt,
  });
});

app.onError((err, c) => {
  logger.error(`request.fail ${c.get("path")}`, {
    requestId: c.get("requestId"),
    path: c.get("path"),
    method: c.get("method"),
    error: err instanceof Error ? err : new Error(String(err)),
  });
  return c.json({ error: "Internal server error" }, 500);
});

// ─── Episodes ───────────────────────────────────────────────────────────────

app.get("/v1/episodes", async (c) => {
  const bandId = c.req.query("bandId");
  const limit = clampInteger(c.req.query("limit"), 50, 1, 100);
  const offset = clampInteger(c.req.query("offset"), 0, 0, Number.MAX_SAFE_INTEGER);

  if (bandId !== undefined && !/^\d+$/.test(bandId)) {
    return c.json({ error: "Invalid bandId" }, 400);
  }

  const supabase = await createClient();
  let query = supabase
    .from("episodes")
    .select("*", { count: "exact" })
    .order("pub_date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (bandId) query = query.eq("band_id", Number(bandId));

  const { data, error, count } = await query;
  if (error) throw toError(error);

  return c.json({ episodes: data ?? [], pagination: { limit, offset, total: count ?? 0 } }, 200, {
    "Cache-Control": CACHE_SHORT,
  });
});

// ─── Single Episode ──────────────────────────────────────────────────────────

app.get("/v1/episode/:id", async (c) => {
  const episodeId = c.req.param("id");
  if (!episodeId) return c.json({ error: "Missing episode ID" }, 400);

  const response = await fetch(FIRSTORY_FEED_URL, {
    headers: { "User-Agent": FIRSTORY_USER_AGENT, Accept: RSS_ACCEPT },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });

  if (!response.ok) {
    if (response.status === 404) return c.json({ error: "Feed not found" }, 404);
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const episode = findEpisodeById(await response.text(), episodeId);
  if (!episode) return c.json({ error: "Episode not found in feed" }, 404);

  return c.json({ episodes: [episode] }, 200, { "Cache-Control": CACHE_MEDIUM });
});

// ─── Firstory Feed ───────────────────────────────────────────────────────────

app.get("/v1/firstory-feed", async (c) => {
  const userId = c.req.query("userId");

  if (!userId || !isValidSlug(userId)) {
    return c.json({ error: "Invalid or missing userId" }, 400);
  }

  const response = await fetch(`https://feed.firstory.me/rss/user/${userId}`, {
    headers: { "User-Agent": FIRSTORY_USER_AGENT, Accept: RSS_ACCEPT },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });

  if (!response.ok) {
    if (response.status === 404) return c.json({ error: "User feed not found" }, 404);
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const episodes = parseFeed(await response.text());
  return c.json({ episodes }, 200, { "Cache-Control": CACHE_MEDIUM });
});

// ─── Playlist Episodes ───────────────────────────────────────────────────────

app.get("/v1/playlist-episodes", async (c) => {
  const playlistId = c.req.query("playlistId");

  if (!playlistId || !isValidSlug(playlistId)) {
    return c.json({ error: "playlistId is required" }, 400);
  }

  const response = await fetch(`https://open.firstory.me/embed/playlists/${playlistId}`, {
    headers: { "User-Agent": FIRSTORY_USER_AGENT },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });

  if (!response.ok) throw new Error(`Failed to fetch playlist: ${response.status}`);

  const html = await response.text();
  const episodeIds: string[] = [];
  const regex = /story\/(cl[a-z0-9]+)/g;
  let match = regex.exec(html);
  while (match !== null) {
    if (!episodeIds.includes(match[1])) episodeIds.push(match[1]);
    match = regex.exec(html);
  }

  return c.json({ episodeIds }, 200, { "Cache-Control": CACHE_MEDIUM });
});

// ─── Sync Episodes (POST) ────────────────────────────────────────────────────

app.post("/v1/sync-episodes", async (c) => {
  if (!(await isSyncAuthorized(c.req.raw))) return c.json({ error: "Unauthorized" }, 401);

  const response = await fetch(FIRSTORY_FEED_URL, {
    headers: { "User-Agent": FIRSTORY_USER_AGENT, Accept: RSS_ACCEPT },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });

  if (!response.ok) throw new Error(`Failed to fetch RSS feed: ${response.status}`);

  const episodes = parseFeedFull(await response.text());
  const supabase = createServiceClient() ?? (await createClient());

  let synced = 0;
  let failed = 0;

  for (const episode of episodes) {
    const { error } = await supabase.from("episodes").upsert(
      {
        episode_id: episode.episodeId,
        title: episode.title,
        description: episode.description,
        audio_url: episode.audioUrl,
        cover_url: episode.coverUrl ?? null,
        pub_date: episode.pubDate,
      },
      { onConflict: "episode_id" },
    );

    if (error) {
      failed++;
      // The reason is logged, not returned: it is the database's message, and
      // it can name columns and constraints.
      logger.warn("sync-episodes.upsert-failed", {
        requestId: c.get("requestId"),
        episodeId: episode.episodeId,
        error: error instanceof Error ? error : new Error(String(error)),
      });
      continue;
    }

    synced++;
  }

  // A sync that wrote nothing is not a success, even though nothing threw.
  // Reporting it as one is how a broken upsert stays invisible.
  return c.json({ success: failed === 0, synced, failed, total: episodes.length });
});

// ─── Sync Playlists (POST) ───────────────────────────────────────────────────

interface PlaylistEntry {
  id?: string;
  episode_id?: string;
}

interface PlaylistAPIResponse {
  episodes?: PlaylistEntry[];
  items?: PlaylistEntry[];
  data?: PlaylistEntry[];
}

function extractEpisodeIds(data: PlaylistAPIResponse): string[] {
  const list = data.episodes ?? data.items ?? data.data ?? [];
  return list.map((ep) => ep.id ?? ep.episode_id).filter((id): id is string => Boolean(id));
}

app.post("/v1/sync-playlists", async (c) => {
  if (!(await isSyncAuthorized(c.req.raw))) return c.json({ error: "Unauthorized" }, 401);

  const requestId = c.get("requestId");
  const supabase = createServiceClient() ?? (await createClient());
  const { data: bands, error } = await supabase
    .from("bands")
    .select("id, name, iframe_url")
    .not("iframe_url", "is", null);

  if (error) throw toError(error);

  let totalMatched = 0;
  const results: Array<{ band: string; episodes?: number; error?: string }> = [];

  for (const band of bands ?? []) {
    const name = band.name ?? String(band.id);
    try {
      const playlistId = band.iframe_url?.match(/playlists\/([^/?]+)/)?.[1];
      if (!playlistId) {
        results.push({ band: name, error: "Invalid playlist URL" });
        continue;
      }

      const response = await fetch(`https://open.firstory.me/api/playlists/${playlistId}`, {
        headers: { "User-Agent": FIRSTORY_USER_AGENT, Accept: "application/json" },
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      });

      if (!response.ok) {
        results.push({ band: name, error: `HTTP ${response.status}` });
        continue;
      }

      const episodeIds = extractEpisodeIds(await response.json());
      if (episodeIds.length === 0) {
        results.push({ band: name, episodes: 0 });
        continue;
      }

      const { error: updateError } = await supabase
        .from("episodes")
        .update({ band_id: band.id })
        .in("episode_id", episodeIds);

      if (updateError) {
        logger.warn("sync-playlists.link-failed", {
          requestId,
          band: name,
          error: updateError,
        });
        results.push({ band: name, error: "Failed to link episodes" });
      } else {
        totalMatched += episodeIds.length;
        results.push({ band: name, episodes: episodeIds.length });
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      logger.warn("sync-playlists.band-failed", {
        requestId,
        band: name,
        error: err instanceof Error ? err : new Error(String(err)),
      });
      results.push({ band: name, error: "Failed to process playlist" });
    }
  }

  return c.json({ success: true, totalMatched, results });
});

// ─── Match Episodes (POST) ───────────────────────────────────────────────────

function matchesBand(title: string, bandName: string): boolean {
  if (bandName === "wayoutwest") return title.includes("way out west");
  if (bandName === "benz & md") return title.includes("benz & md") || title.includes("benz and md");
  return title.includes(bandName);
}

app.post("/v1/match-episodes", async (c) => {
  if (!(await isSyncAuthorized(c.req.raw))) return c.json({ error: "Unauthorized" }, 401);

  const supabase = createServiceClient() ?? (await createClient());

  const { data: bands, error: bandsError } = await supabase.from("bands").select("id, name");
  if (bandsError) throw toError(bandsError);

  const { data: episodes, error: episodesError } = await supabase
    .from("episodes")
    .select("id, title, band_id");
  if (episodesError) throw toError(episodesError);

  const idsByBand = new Map<number, number[]>();
  for (const episode of episodes ?? []) {
    const title = episode.title.toLowerCase();
    for (const band of bands ?? []) {
      if (!band.name || !matchesBand(title, band.name.toLowerCase())) continue;
      const ids = idsByBand.get(band.id) ?? [];
      ids.push(episode.id);
      idsByBand.set(band.id, ids);
      break;
    }
  }

  let matched = 0;
  for (const [bandId, ids] of idsByBand) {
    const { error } = await supabase.from("episodes").update({ band_id: bandId }).in("id", ids);
    if (!error) matched += ids.length;
  }

  return c.json({ success: true, matched, total: episodes?.length ?? 0 });
});

export const GET = handle(app);
export const POST = handle(app);
