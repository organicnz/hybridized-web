import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const FIRSTORY_RSS_URL =
  "https://feed.firstory.me/rss/user/cl3ps0kge021i01y69qhnf36d";
const BATCH_SIZE = 5; // Very small batches to avoid resource limits
const BATCH_DELAY_MS = 200; // Delay between batches
const MAX_EPISODES = 20; // Limit RSS episodes to leave time for playlist sync
const MAX_PLAYLISTS = 5; // Limit playlists per run to avoid timeout

// Playlist mappings from context/public-playlists-bands.md
// Keys match exact band names in database
const PLAYLIST_MAPPINGS: Record<string, string> = {
  Hybrid: "cl3psyukh023801097bci18gj",
  "Alex Hall": "cl3rgq2bf02yx01y60bgy3jmo",
  "Andrew Kelly": "cl3rloh39032901y663eueb40",
  "Benz & MD": "cl3rmtqxu033s01092gap8bwj",
  Burufunk: "cl3rrc7fz037e01092ooseerg",
  Deepsky: "cl3sh68xw05e501y66vj773pt",
  "Digital Witchcraft": "cl3sk0sy705yw0109bn0k8uy2",
  DjKiRA: "cl3smkld9061q0109an6xbv1p",
  Grayarea: "cl3sygxmf06be01093w463uc3",
  "James Warren": "cl3uh660y09qz01y6d2q1g637",
  "Jason Dunne": "cl3ur5opm000m01xd9pp97an4",
  "J-Slyde": "cl69ywa5v00tx01w24fnf0z6j",
  KiloWatts: "cl3vqqpkb002b01w9geoeac9n",
  Micah: "cl3vyad4e005m01u3bglz1smr",
  "Nick Lewis": "cl3wsic3v02lu01u34s151vuy",
  "Noel Sanger": "cl3wwj46z031k01w918hv222b",
  NuBreed: "cl3x21g00033x01u3ffqabrzt",
  Shiloh: "cl3x3n4qm034y01u3be7a0mdh",
  "Stefan Weise": "cl3yvfzo206bk01w9gm3n2p37",
  Trafik: "cl411yyz809wo01w94x9lg1fu",
  "V-Sag": "cl415agar000301uf4rlubvtf",
  Wayoutwest: "cl416c4kz09ze01w9fptndp5l",
};

interface Band {
  id: number;
  name: string;
}

interface Episode {
  id: number;
  episode_id: string;
  band_id: number | null;
  title: string;
}

// Helper to extract text from CDATA or regular tags
function extractText(xml: string, tag: string): string {
  try {
    const cdataMatch = xml.match(
      new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`),
    );
    if (cdataMatch) return cdataMatch[1].trim();

    const textMatch = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`));
    return textMatch ? textMatch[1].trim() : "";
  } catch {
    return "";
  }
}

// Helper to extract attribute value
function extractAttr(xml: string, tag: string, attr: string): string {
  try {
    const match = xml.match(new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`));
    return match ? match[1] : "";
  } catch {
    return "";
  }
}

// Helper to match band from title
function matchBandFromTitle(title: string, bands: Band[]): number | null {
  if (!title || !bands || bands.length === 0) return null;

  const titleLower = title.toLowerCase();

  // Extract the artist name from title (format: "Artist Name - Show Title")
  const artistMatch = title.match(/^([^-]+)\s*-/);
  const artistName = artistMatch
    ? artistMatch[1].trim().toLowerCase()
    : titleLower;

  // Special case: Greg Benz belongs to Benz & MD
  if (artistName.includes("greg benz")) {
    const benzMdBand = bands.find((b) => b.name.toLowerCase() === "benz & md");
    if (benzMdBand) return benzMdBand.id;
  }

  // Sort bands by name length (longest first) for better matching
  const sortedBands = [...bands].sort((a, b) => b.name.length - a.name.length);

  // First pass: exact match on artist name (before the dash)
  for (const band of sortedBands) {
    const bandNameLower = band.name.toLowerCase();
    if (artistName === bandNameLower) {
      return band.id;
    }
  }

  // Second pass: check if band name appears at the start of title
  for (const band of sortedBands) {
    const bandNameLower = band.name.toLowerCase();
    if (
      titleLower.startsWith(bandNameLower + " -") ||
      titleLower.startsWith(bandNameLower + "-")
    ) {
      return band.id;
    }
  }

  // Third pass: check if band name appears in artist name portion only
  for (const band of sortedBands) {
    const bandNameLower = band.name.toLowerCase();
    if (artistName.includes(bandNameLower)) {
      return band.id;
    }
  }

  return null;
}

// Helper to validate episode data
function validateEpisodeData(data: any): boolean {
  return !!(
    data.episode_id &&
    data.title &&
    data.audio_url &&
    data.episode_id.length > 0 &&
    data.title.length > 0 &&
    data.audio_url.startsWith("http")
  );
}

// Helper to sleep
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Authorization check using custom secret
    const authHeader = req.headers.get("Authorization");
    const functionSecret = Deno.env.get("FUNCTION_SECRET");

    if (functionSecret && authHeader !== `Bearer ${functionSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Fetching RSS feed from Firstory...");

    const response = await fetch(FIRSTORY_RSS_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
    }

    const xmlText = await response.text();

    // Extract items using regex
    const itemMatches = xmlText.matchAll(/<item>([\s\S]*?)<\/item>/g);
    const allItems = Array.from(itemMatches);

    // Limit episodes to avoid timeout
    const items = allItems.slice(0, MAX_EPISODES);

    console.log(
      `Found ${allItems.length} episodes in RSS feed, processing ${items.length}`,
    );

    const { data: bands, error: bandsError } = await supabase
      .from("bands")
      .select("id, name");

    if (bandsError) {
      throw new Error(`Failed to fetch bands: ${bandsError.message}`);
    }

    let matched = 0;
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    const totalBatches = Math.ceil(items.length / BATCH_SIZE);

    console.log(
      `Processing ${items.length} episodes in ${totalBatches} batches of ${BATCH_SIZE}`,
    );

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const start = batchIndex * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, items.length);
      const batch = items.slice(start, end);

      console.log(
        `Batch ${batchIndex + 1}/${totalBatches}: Processing episodes ${start + 1}-${end}`,
      );

      for (const itemMatch of batch) {
        try {
          const itemXml = itemMatch[1];

          // Carefully extract all fields
          const title = extractText(itemXml, "title");
          const guid = extractText(itemXml, "guid");
          const episodeId = guid;
          const link = extractText(itemXml, "link");
          const audioUrl = extractAttr(itemXml, "enclosure", "url");
          const audioLengthStr = extractAttr(itemXml, "enclosure", "length");
          const audioLength = audioLengthStr ? parseInt(audioLengthStr) : 0;
          const enclosureType =
            extractAttr(itemXml, "enclosure", "type") || "audio/mpeg";
          const coverUrl = extractAttr(itemXml, "itunes:image", "href");
          const durationStr = extractText(itemXml, "itunes:duration");
          const duration = durationStr ? parseInt(durationStr) : 0;
          const pubDateStr = extractText(itemXml, "pubDate");
          const creator = extractText(itemXml, "dc:creator") || "Hybridized";
          const explicit = extractText(itemXml, "itunes:explicit") === "yes";
          const description = extractText(itemXml, "description");

          // Parse date carefully
          let pubDate: Date;
          try {
            pubDate = pubDateStr ? new Date(pubDateStr) : new Date();
            if (isNaN(pubDate.getTime())) {
              pubDate = new Date();
            }
          } catch {
            pubDate = new Date();
          }

          // Validate required fields
          const episodeData = {
            episode_id: episodeId,
            guid: episodeId,
            title,
            description,
            link,
            audio_url: audioUrl,
            audio_length: audioLength,
            enclosure_type: enclosureType,
            cover_url: coverUrl || null,
            duration,
            pub_date: pubDate.toISOString(),
            creator,
            explicit,
            band_id: null as number | null,
          };

          if (!validateEpisodeData(episodeData)) {
            console.warn(`Skipping invalid episode: ${title || "unknown"}`);
            skipped++;
            continue;
          }

          // Check if episode exists
          const { data: existing, error: existingError } = await supabase
            .from("episodes")
            .select("id, band_id, title")
            .eq("episode_id", episodeId)
            .maybeSingle();

          if (existingError) {
            console.error(
              `DB error for ${episodeId}: ${existingError.message}`,
            );
            errors++;
            continue;
          }

          // Match band carefully
          let matchedBandId = existing?.band_id || null;

          if (!matchedBandId && bands && title) {
            matchedBandId = matchBandFromTitle(title, bands);
            if (matchedBandId) {
              matched++;
            }
          }

          episodeData.band_id = matchedBandId;

          // Update or insert
          if (existing) {
            const { error: updateError } = await supabase
              .from("episodes")
              .update(episodeData)
              .eq("id", existing.id);

            if (updateError) {
              console.error(
                `Update failed for ${episodeId}: ${updateError.message}`,
              );
              errors++;
            } else {
              updated++;
            }
          } else {
            const { error: insertError } = await supabase
              .from("episodes")
              .insert(episodeData);

            if (insertError) {
              console.error(
                `Insert failed for ${episodeId}: ${insertError.message}`,
              );
              errors++;
            } else {
              created++;
            }
          }
        } catch (itemError) {
          console.error(`Item processing error: ${itemError}`);
          errors++;
        }
      }

      // Small delay between batches to be gentle on the database
      if (batchIndex < totalBatches - 1) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    // Phase 2: Fetch episodes from band playlists for accurate matching
    console.log("Phase 2: Syncing episodes from band playlists...");

    let playlistMatched = 0;
    let playlistErrors = 0;
    const playlistResults: any[] = [];
    let playlistsProcessed = 0;

    for (const [bandName, playlistId] of Object.entries(PLAYLIST_MAPPINGS)) {
      if (playlistsProcessed >= MAX_PLAYLISTS) {
        console.log(`Reached max playlists limit (${MAX_PLAYLISTS})`);
        break;
      }
      try {
        // Find the band in database
        const { data: bandData } = await supabase
          .from("bands")
          .select("id")
          .eq("name", bandName)
          .single();

        if (!bandData) {
          console.log(`Band not found: ${bandName}`);
          continue;
        }

        console.log(`Fetching playlist for ${bandName}...`);

        // Fetch playlist page HTML
        const playlistUrl = `https://hybridized.firstory.io/episodes?playlist=${playlistId}`;
        const response = await fetch(playlistUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; HybridizedApp/1.0)",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();

        // Extract episode IDs from HTML (format: /episodes/clXXXXXXXXXXXXXXXXXXXXXX)
        const episodeMatches = html.matchAll(/\/episodes\/(cl[a-z0-9]+)/g);
        const episodeIds = [
          ...new Set(Array.from(episodeMatches).map((m) => m[1])),
        ];

        if (episodeIds.length > 0) {
          // Update episodes with correct band_id
          const { data: updatedEpisodes } = await supabase
            .from("episodes")
            .update({ band_id: bandData.id })
            .in("episode_id", episodeIds)
            .select("id");

          const updatedCount = updatedEpisodes?.length || 0;
          playlistMatched += updatedCount;
          playlistResults.push({
            band: bandName,
            found: episodeIds.length,
            updated: updatedCount,
          });

          console.log(
            `${bandName}: ${updatedCount}/${episodeIds.length} episodes matched`,
          );
        }

        playlistsProcessed++;

        // Delay between requests
        await sleep(BATCH_DELAY_MS);
      } catch (error) {
        console.error(`Error processing playlist for ${bandName}: ${error}`);
        playlistErrors++;
        playlistResults.push({
          band: bandName,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const { count: totalEpisodes } = await supabase
      .from("episodes")
      .select("*", { count: "exact", head: true });

    const { count: episodesWithBands } = await supabase
      .from("episodes")
      .select("*", { count: "exact", head: true })
      .not("band_id", "is", null);

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      phase1_rss: {
        episodes: items.length,
        created,
        updated,
        matched,
        skipped,
        errors,
        processed: created + updated + skipped + errors,
      },
      phase2_playlists: {
        bands_processed: playlistResults.length,
        episodes_matched: playlistMatched,
        errors: playlistErrors,
        results: playlistResults,
      },
      verification: {
        total_episodes: totalEpisodes,
        episodes_with_bands: episodesWithBands,
        coverage_percentage: totalEpisodes
          ? (((episodesWithBands || 0) / totalEpisodes) * 100).toFixed(1)
          : 0,
      },
    };

    console.log("Sync completed successfully:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Sync error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          Connection: "keep-alive",
        },
      },
    );
  }
});
