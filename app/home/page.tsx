import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ArtistNav } from "@/components/artist-nav";
import { NowPlaying } from "@/components/now-playing";
import { MixList } from "@/components/mix-list";
import { ArtistProfile } from "@/components/artist-profile";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: items, error } = await supabase
    .from("hybridized")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error('Error fetching items:', error);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-zinc-950 via-zinc-900 to-black">
      <Header />
      <ArtistNav />
      
      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-4 md:p-6">
        {/* Main Content Panel - 65% */}
        <div className="w-full lg:w-[65%] space-y-4">
          <NowPlaying />
          <MixList items={items || []} />
        </div>

        {/* Sidebar Panel - 35% */}
        <aside className="w-full lg:w-[35%]">
          <ArtistProfile />
        </aside>
      </main>

      <Footer />
    </div>
  );
}
