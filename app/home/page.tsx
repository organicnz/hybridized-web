import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ArtistNav } from "@/components/artist-nav";
import { HomeClient } from "./home-client";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: items, error } = await supabase
    .from("bands")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error('Error fetching items:', error);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#121212]">
      <Header />
      <ArtistNav />
      <HomeClient items={items || []} />
      <Footer />
    </div>
  );
}
