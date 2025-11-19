import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
        const message =
          error instanceof Error ? error.message : "Unknown error";
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
    const message =
      error instanceof Error ? error.message : "Failed to sync playlists";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function extractEpisodeIdsFromAPI(data: any): string[] {
  const episodeIds: string[] = [];

  // Try to extract episode IDs from various possible API response structures
  if (data.episodes && Array.isArray(data.episodes)) {
    episodeIds.push(
      ...data.episodes.map((ep: any) => ep.id || ep.episode_id).filter(Boolean),
    );
  } else if (data.items && Array.isArray(data.items)) {
    episodeIds.push(
      ...data.items
        .map((item: any) => item.id || item.episode_id)
        .filter(Boolean),
    );
  } else if (data.data && Array.isArray(data.data)) {
    episodeIds.push(
      ...data.data
        .map((item: any) => item.id || item.episode_id)
        .filter(Boolean),
    );
  }

  return episodeIds;
}
