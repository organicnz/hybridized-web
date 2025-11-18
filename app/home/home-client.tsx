"use client";

import { useEffect } from "react";
import { ArtistProfile } from "@/components/artist-profile";
import type { Database } from "@/lib/types/database.types";
import { useCachedBands } from "@/hooks/use-cached-bands";
import { cacheBands } from "@/lib/music-cache";

type HybridizedItem = Database["public"]["Tables"]["bands"]["Row"];

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
  const { bands: cachedBands } = useCachedBands(items);

  // Cache the data when component mounts
  useEffect(() => {
    if (items.length > 0) {
      cacheBands(items).catch(console.error);
    }
  }, [items]);

  // Use cached data if available, otherwise use server data
  const displayItems = cachedBands.length > 0 ? cachedBands : items;

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
            {items.length} {items.length === 1 ? "mix" : "mixes"} available
          </p>
        </div>

        {/* Embedded Players Grid */}
        <div className="space-y-4">
          {displayItems.map((item) => (
            <div
              key={item.id}
              className="bg-[#181818] rounded-lg overflow-hidden border border-white/5 hover:bg-[#282828] transition-colors group"
            >
              {/* Mix Info */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-[#1DB954] transition-colors">
                  {item.name || "Untitled Mix"}
                </h3>
                {item.description && (
                  <p className="text-sm text-white/50 line-clamp-2 mb-3">
                    {item.description}
                  </p>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-white/40 mb-3">
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
                    height="166"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="w-full"
                    title={`Player for ${item.name || "mix"}`}
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
