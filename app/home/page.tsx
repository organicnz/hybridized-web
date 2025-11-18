import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { createClient } from "@/lib/supabase/server";
import { Play, Music2 } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("hybridized")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-900 via-black to-blue-900">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-24">
        <div className="mb-12 text-center">
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Hybrid Sounds
          </h1>
          <p className="text-xl text-purple-200/80">
            Explore our collection of unique musical formulas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items?.map((item) => (
            <div
              key={item.id}
              className="group relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl border border-purple-500/20 hover:border-purple-500/50 transition-all overflow-hidden hover:scale-105"
            >
              {item.cover_url ? (
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={item.cover_url}
                    alt={item.name || ""}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-purple-500/50">
                    <Play className="w-8 h-8 text-white ml-1" fill="white" />
                  </button>
                </div>
              ) : (
                <div className="relative h-64 bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
                  <Music2 className="w-20 h-20 text-purple-400/50" />
                </div>
              )}
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-2">{item.name || "Untitled"}</h2>
                <p className="text-purple-200/70 mb-4">{item.description || "No description available"}</p>
                {item.formula && (
                  <div className="inline-block px-3 py-1 bg-purple-500/20 rounded-full text-sm text-purple-300 border border-purple-500/30">
                    {item.formula}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {(!items || items.length === 0) && (
          <div className="text-center py-20">
            <Music2 className="w-20 h-20 text-purple-400/50 mx-auto mb-4" />
            <p className="text-xl text-purple-200/60">No hybrid sounds available yet</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
