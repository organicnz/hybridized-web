"use client";

import { useEffect } from "react";
import { ArtistProfile } from "@/components/artist-profile";
import type { Database } from "@/lib/types/database.types";
import { useCachedBands } from "@/hooks/use-cached-bands";
import { cacheBands } from "@/lib/music-cache";
import { usePlayer } from "@/lib/player-context";
import { Play } from "lucide-react";

type HybridizedItem = Database["public"]["Tables"]["bands"]["Row"];

function PlayButton({ item }: { item: HybridizedItem }) {
  const { play } = usePlayer();

  return (
    <button
      onClick={() => play(item)}
      className="w-full px-6 py-3 bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold rounded-full transition-all hover:scale-105 flex items-center justify-center gap-2"
    >
      <Play className="w-5 h-5" fill="currentColor" />
      Play Mix
    </button>
  );
}

interface HomeClientProps {
  items: HybridizedItem[];
  allBands?: HybridizedItem[];
  currentArtist?: string;
}

export function HomeClient({
  items,
  allBands,
  currentArtist,
}: HomeClientProps) {
  // Cache the data when component mounts
  useEffect(() => {
    if (items.length > 0) {
      cacheBands(items).catch(console.error);
    }
  }, [items]);

  // Always use server-provided items (already filtered by artist)
  const displayItems = items;

  return (
    <main className="flex-1 flex flex-col lg:flex-row gap-6 p-4 md:p-6">
      {/* Main Content Panel - 65% */}
      <div className="w-full lg:w-[65%] space-y-6">
        {/* Artist Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">
            {currentArtist || "All Mixes"}
          </h1>
          <p className="text-white/50">
            {displayItems.length} {displayItems.length === 1 ? "playlist" : "playlists"}
          </p>
        </div>

        {/* Embedded Players Grid */}
        <div className="space-y-6">
          {displayItems.map((item) => (
            <div
              key={item.id}
              className="bg-[#181818] rounded-xl overflow-hidden border border-white/5 hover:border-white/10 transition-all group"
            >
              {/* Mix Info */}
              <div className="p-6 pb-4">
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-[#1DB954] transition-colors">
                  {item.name || "Untitled Playlist"}
                </h3>
                {item.description && (
                  <p className="text-sm text-white/60 line-clamp-3 mb-4">
                    {item.description}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-white/40">
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  {item.formula && <span>• {item.formula}</span>}
                </div>
              </div>

              {/* Embedded Player */}
              {item.iframe_url && (
                <div className="bg-black/20">
                  <iframe
                    src={item.iframe_url}
                    width="100%"
                    height="450"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="w-full"
                    title={`Player for ${item.name || "playlist"}`}
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {displayItems.length === 0 && (
          <div className="bg-[#181818] rounded-lg p-12 text-center border border-white/5">
            <p className="text-white/50">No mixes available for this artist</p>
          </div>
        )}

        {/* Bottom padding for persistent player */}
        <div className="h-24" />
      </div>

      {/* Sidebar Panel - 35% */}
      <aside className="w-full lg:w-[35%]">
        <ArtistProfile
          artist={{
            name: currentArtist || "Hybrid",
            bio: displayItems[0]?.description || "No description available",
            coverUrl: displayItems[0]?.cover_url || undefined,
          }}
        />
      </aside>
    </main>
  );
}
