import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ArtistNav } from "@/components/artist-nav";
import { HomeClient } from "../home-client";
import { createClient } from "@/lib/supabase/server";
import { createStaticClient } from "@/lib/supabase/static";
import { notFound } from "next/navigation";
import { getCachedBands, getCachedArtistBands } from "@/lib/cache";

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
    artist: band.name?.toLowerCase().replace(/\s+/g, '-') || '',
  }));
}

// Revalidate every 5 minutes
export const revalidate = 300;

export default async function ArtistPage({ params }: PageProps) {
  const { artist } = await params;
  const artistName = artist.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');

  const supabase = await createClient();
  
  // Fetch all bands for the list
  const { data: allBands } = await supabase
    .from("bands")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch specific artist's mixes
  const { data: artistBands, error } = await supabase
    .from("bands")
    .select("*")
    .ilike("name", artistName)
    .order("created_at", { ascending: false });

  if (error || !artistBands || artistBands.length === 0) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#121212]">
      <Header />
      <ArtistNav activeArtist={artistName} />
      <HomeClient items={artistBands} allBands={allBands || []} currentArtist={artistName} />
      <Footer />
    </div>
  );
}
