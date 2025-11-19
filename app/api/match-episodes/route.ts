import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();

    // Get all bands
    const { data: bands, error: bandsError } = await supabase
      .from("bands")
      .select("id, name");

    if (bandsError) throw bandsError;

    // Get all episodes
    const { data: episodes, error: episodesError } = await supabase
      .from("episodes")
      .select("id, title, episode_id");

    if (episodesError) throw episodesError;

    let matchedCount = 0;

    // Match episodes to bands based on artist name in title
    for (const episode of episodes || []) {
      const title = episode.title.toLowerCase();

      for (const band of bands || []) {
        const bandName = band.name.toLowerCase();

        // Check if band name appears in episode title
        // Handle special cases
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
          // Update episode with band_id
          const { error: updateError } = await supabase
            .from("episodes")
            .update({ band_id: band.id })
            .eq("id", episode.id);

          if (!updateError) {
            matchedCount++;
          }
          break; // Only match to first band found
        }
      }
    }

    return NextResponse.json({
      success: true,
      matched: matchedCount,
      total: episodes?.length || 0,
    });
  } catch (error) {
    console.error("Error matching episodes:", error);
    const message =
      error instanceof Error ? error.message : "Failed to match episodes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
