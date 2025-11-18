"use client";

import { useState } from "react";
import { NowPlaying } from "@/components/now-playing";
import { MixList } from "@/components/mix-list";
import { ArtistProfile } from "@/components/artist-profile";
import type { Database } from "@/lib/types/database.types";

type HybridizedItem = Database['public']['Tables']['hybridized']['Row'];

interface HomeClientProps {
  items: HybridizedItem[];
}

export function HomeClient({ items }: HomeClientProps) {
  const [currentItem, setCurrentItem] = useState<HybridizedItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = (item: HybridizedItem) => {
    if (currentItem?.id === item.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentItem(item);
      setIsPlaying(true);
    }
  };

  const handleClose = () => {
    setCurrentItem(null);
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <main className="flex-1 flex flex-col lg:flex-row gap-6 p-4 md:p-6">
      {/* Main Content Panel - 65% */}
      <div className="w-full lg:w-[65%] space-y-4">
        {currentItem && (
          <div className="space-y-4">
            {/* Now Playing Card */}
            <NowPlaying
              artistName={currentItem.name || "Untitled"}
              trackName={currentItem.description || ""}
              currentTime={0}
              duration={0}
              isPlaying={isPlaying}
              onClose={handleClose}
              onPlayPause={handlePlayPause}
              onSeek={() => {}}
            />
            
            {/* Embedded Player */}
            {currentItem.iframe_url && (
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10">
                <iframe
                  src={currentItem.iframe_url}
                  width="100%"
                  height="166"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="w-full"
                  title={`Player for ${currentItem.name || 'mix'}`}
                />
              </div>
            )}
          </div>
        )}
        
        <MixList items={items} onPlay={handlePlay} />
      </div>

      {/* Sidebar Panel - 35% */}
      <aside className="w-full lg:w-[35%]">
        <ArtistProfile />
      </aside>
    </main>
  );
}
