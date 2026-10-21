import { ArtistNav } from "@/components/artist-nav";
import { createStaticClient } from "@/lib/supabase/static";
import { slugify, slugifyEncoded } from "@/lib/utils/slug";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { HomeClient } from "../home-client";

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
    // A definite, shrinkable height rather than `min-h-screen`: an
    // indefinite height leaves the flex chain below it unable to scroll, and
    // the content ends up clipped instead of reachable.
    <div className="flex min-h-0 flex-1 flex-col text-foreground">
      {/* Content only — ambient mesh handled by root layout */}

      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        <ArtistNav activeArtist={artistName} />
        {/* `min-h-0` so this can shrink and scroll. `id` so the root
            layout's "Skip to content" link has a target here, the way it
            does on the pages that use <AppShell>. */}
        <main
          id="main-content"
          className="min-h-0 flex-1 overflow-y-auto px-4 py-8 md:px-8 md:py-10 lg:px-12"
        >
          {/* The column fills the pane, so the region below it has a definite
              height to be sized against. */}
          <div className="mx-auto max-w-6xl space-y-8 lg:flex lg:h-full lg:flex-col">
            {/* Hero header — glass card with gradient text */}
            <section className="glass relative flex-none overflow-hidden rounded-3xl p-8 md:p-12">
              <div
                className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-purple-500/15 blur-[120px]"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-pink-500/15 blur-[100px]"
                aria-hidden="true"
              />

              <h1 className="gradient-text mb-4 font-display text-fluid-2xl font-bold tracking-tight md:text-fluid-3xl">
                {artistName}
              </h1>
              {artistProfile.description && (
                <p className="max-w-2xl text-lg leading-relaxed font-light text-muted-foreground md:text-xl">
                  {artistProfile.description}
                </p>
              )}
            </section>

            {/* Main content from home-client inside glass card.
                On a desktop this is a fixed-height region filling the pane,
                so the sets list and the artist profile each scroll inside
                it instead of being clipped by the pane. */}
            <section className="glass flex rounded-3xl p-4 sm:p-6 md:p-8 lg:flex lg:h-full lg:shrink-0 lg:flex-col">
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
        <div className="flex h-full flex-col overflow-hidden">
          <ArtistNav activeArtist="" />
        </div>
      }
    >
      <ArtistContent params={params} />
    </Suspense>
  );
}
