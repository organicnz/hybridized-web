import { ArtistNav } from "@/components/artist-nav";
import { HomeClient } from "../home-client";
import { createClient } from "@/lib/supabase/server";
import { createStaticClient } from "@/lib/supabase/static";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ artist: string }>;
}

// Enable static generation for known artists
export async function generateStaticParams() {
  const supabase = createStaticClient();
  const { data: bands } = await supabase
    .from("bands")
    .select("name")
    .order("name");

  if (!bands) return [];

  return bands.map((band) => ({
    artist: encodeURIComponent(
      band.name?.toLowerCase().replace(/\s+/g, "-") || "",
    ),
  }));
}

// Revalidate every 5 minutes
export const revalidate = 300;

export default async function ArtistPage({ params }: PageProps) {
  const { artist } = await params;
  const decodedArtist = decodeURIComponent(artist);

  const supabase = await createClient();

  // First, try to find the band by matching the slug format
  // Get all bands and find the one whose slug matches
  const { data: allBands } = await supabase.from("bands").select("*");

  const matchedBand = allBands?.find((band) => {
    const bandSlug = band.name?.toLowerCase().replace(/\s+/g, "-") || "";
    return bandSlug === decodedArtist;
  });

  if (!matchedBand) {
    notFound();
  }

  const artistName = matchedBand.name;

  // Fetch specific artist's mixes
  const { data: artistBands, error } = await supabase
    .from("bands")
    .select("*")
    .eq("name", artistName)
    .order("created_at", { ascending: false });

  if (error || !artistBands || artistBands.length === 0) {
    notFound();
  }

  // Fetch episodes for each band
  const bandsWithEpisodes = await Promise.all(
    artistBands.map(async (band) => {
      const { data: episodes } = await supabase
        .from("episodes")
        .select("*")
        .eq("band_id", band.id)
        .order("pub_date", { ascending: false });

      return {
        ...band,
        episodes: episodes || [],
      };
    }),
  );

  // Get artist profile data from first band entry
  const artistProfile = artistBands[0];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ArtistNav activeArtist={artistName} />
      <div className="flex-1 min-h-0">
        <HomeClient
          items={bandsWithEpisodes}
          currentArtist={artistName}
          artistBio={artistProfile.description || undefined}
          artistCoverUrl={artistProfile.cover_url || undefined}
          soundcloudUrl={artistProfile.soundcloud_url || undefined}
        />
      </div>
    </div>
  );
}
