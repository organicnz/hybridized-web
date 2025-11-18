import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ArtistNav } from "@/components/artist-nav";
import { NowPlaying } from "@/components/now-playing";
import { MixList } from "@/components/mix-list";
import { ArtistProfile } from "@/components/artist-profile";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("hybridized")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen flex flex-col bg-[#5B6B7F]">
      <Header />
      <ArtistNav />
      
      <main className="flex-1 flex gap-0">
        {/* Main Content Panel - 65% */}
        <div className="flex-1 lg:w-[65%] p-6 space-y-4">
          <NowPlaying />
          <MixList items={items || []} />
        </div>

        {/* Sidebar Panel - 35% */}
        <aside className="hidden lg:block lg:w-[35%] p-6">
          <ArtistProfile />
        </aside>
      </main>

      <Footer />
    </div>
  );
}
