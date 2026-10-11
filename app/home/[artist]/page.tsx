import type { Metadata } from "next";
import { ArtistNav } from "@/components/artist-nav";
import { createStaticClient } from "@/lib/supabase/static";
import { slugify, slugifyEncoded } from "@/lib/utils/slug";
import { notFound } from "next/navigation";
import { HomeClient } from "../home-client";
import { Suspense } from "react";

interface PageProps {
  params: Promise<{ artist: string }>;
}

// Enable static generation for known artists
export async function generateStaticParams() {
  const supabase = createStaticClient();
  const { data: bands } = await supabase.from("bands").select("name").order("name");

  if (!bands) return [];

  return bands.map((band) => ({
    artist: band.name ? slugifyEncoded(band.name) : "",
  }));
}

export const cacheLife = "hours";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { artist } = await params;
  const decodedArtist = decodeURIComponent(artist);
  const title = decodedArtist;

  return {
    title,
    description: `Stream ${decodedArtist} DJ mixes, radio shows and episodes on Hybridized.`,
    openGraph: {
      title,
      description: `Stream ${decodedArtist} DJ mixes, radio shows and episodes on Hybridized.`,
    },
  };
}

async function ArtistContent({ params }: PageProps) {
  const { artist } = await params;
  const decodedArtist = decodeURIComponent(artist);

  const supabase = createStaticClient();

  const { data: allBands } = await supabase.from("bands").select("id, name");

  const matchedBand = allBands?.find((band) => {
    if (!band.name) return false;
    return slugify(band.name) === decodedArtist;
  });

  if (!matchedBand) {
    notFound();
  }

  const artistName = matchedBand.name;
  if (!artistName) {
    notFound();
  }

  const { data: artistBands, error } = await supabase
    .from("bands")
    .select("*")
    .eq("name", artistName)
    .order("created_at", { ascending: false });

  if (error || !artistBands || artistBands.length === 0) {
    notFound();
  }

  const bandIds = artistBands.map((band) => band.id);
  const { data: allEpisodes } = await supabase
    .from("episodes")
    .select("*")
    .in("band_id", bandIds)
    .order("pub_date", { ascending: false })
    .limit(100);

  const episodesByBand = new Map<number, NonNullable<typeof allEpisodes>>();
  for (const episode of allEpisodes ?? []) {
    if (episode.band_id === null) continue;
    const bucket = episodesByBand.get(episode.band_id);
    if (bucket) bucket.push(episode);
    else episodesByBand.set(episode.band_id, [episode]);
  }

  const bandsWithEpisodes = artistBands.map((band) => ({
    ...band,
    episodes: episodesByBand.get(band.id) ?? [],
  }));

  const artistProfile = artistBands[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0220] via-[#0f0a18] to-[#0a0a0f] text-foreground">
      {/* Ambient gradient mesh — glassmorphic spec */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_20%_30%,rgba(124,58,237,0.12)_0%,transparent_50%),radial-gradient(circle_at_80%_70%,rgba(236,72,153,0.12)_0%,transparent_50%),radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.08)_0%,transparent_60%)]" />

      <div className="relative z-10 flex flex-col min-h-screen overflow-hidden">
        <ArtistNav activeArtist={artistName} />
        <main className="flex-1 overflow-y-auto px-4 py-10 md:px-8 lg:px-12">
          <div className="max-w-6xl mx-auto space-y-12">
            {/* Hero header — glass card with gradient text */}
            <section className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-2xl shadow-[0_20px_60px_-20px_rgba(124,58,237,0.25)] p-8 md:p-12">
              <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-pink-400/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

              <h1 className="text-fluid-2xl md:text-fluid-3xl font-black gradient-text tracking-tight mb-4">
                {artistName}
              </h1>
              {artistProfile.description && (
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed font-light">
                  {artistProfile.description}
                </p>
              )}
            </section>

            {/* Main content from home-client inside glass card */}
            <section className="rounded-3xl border border-white/10 bg-card/60 backdrop-blur-xl shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] p-6 md:p-8">
              <HomeClient
                items={bandsWithEpisodes}
                currentArtist={artistName}
                artistBio={artistProfile.description || undefined}
                artistCoverUrl={artistProfile.cover_url || undefined}
                soundcloudUrl={artistProfile.soundcloud_url || undefined}
              />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default async function ArtistPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col h-full overflow-hidden">
          <ArtistNav activeArtist="" />
        </div>
      }
    >
      <ArtistContent params={params} />
    </Suspense>
  );
}
