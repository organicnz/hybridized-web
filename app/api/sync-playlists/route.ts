import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createClient();

    // Get all bands with their playlist URLs
    const { data: bands, error: bandsError } = await supabase
      .from("bands")
      .select("id, name, iframe_url")
      .not("iframe_url", "is", null);

    if (bandsError) throw bandsError;

    let totalMatched = 0;
    const results = [];

    for (const band of bands || []) {
      try {
        // Extract playlist ID from iframe URL
        const playlistMatch = band.iframe_url?.match(/playlists\/([^/?]+)/);
        if (!playlistMatch) {
          results.push({ band: band.name, error: "Invalid playlist URL" });
          continue;
        }

        const playlistId = playlistMatch[1];

        // Fetch the Firstory API to get playlist episodes
        const apiUrl = `https://open.firstory.me/api/playlists/${playlistId}`;
        const response = await fetch(apiUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; HybridizedApp/1.0)",
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          results.push({ band: band.name, error: `HTTP ${response.status}` });
          continue;
        }

        const playlistData = await response.json();
        const episodeIds = extractEpisodeIdsFromAPI(playlistData);

        if (episodeIds.length === 0) {
          results.push({ band: band.name, episodes: 0 });
          continue;
        }

        // Update episodes in database to set band_id
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

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        results.push({ band: band.name, error: message });
      }
    }

    return NextResponse.json({
      success: true,
      totalMatched,
      results,
    });
  } catch (error) {
    console.error("Error syncing playlists:", error);
    const message = error instanceof Error ? error.message : "Failed to sync playlists";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

interface PlaylistEntry {
  id?: string;
  episode_id?: string;
}

interface PlaylistAPIResponse {
  episodes?: PlaylistEntry[];
  items?: PlaylistEntry[];
  data?: PlaylistEntry[];
}

function extractEpisodeIdsFromAPI(data: PlaylistAPIResponse): string[] {
  const list = data.episodes ?? data.items ?? data.data ?? [];
  return list.map((ep) => ep.id ?? ep.episode_id).filter((id): id is string => Boolean(id));
}
