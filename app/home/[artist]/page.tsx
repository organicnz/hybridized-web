import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ArtistNav } from "@/components/artist-nav";
import { HomeClient } from "../home-client";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ artist: string }>;
}

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
