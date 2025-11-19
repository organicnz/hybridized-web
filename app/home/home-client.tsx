"use client";

import { useEffect, useRef } from "react";
import { ArtistProfile } from "@/components/artist-profile";
import { IframePlayer } from "@/components/iframe-player";
import { useAudioPlayer } from "@/lib/audio-player-context";
import { soundCloudManager } from "@/lib/soundcloud-widget-manager";
import type { Database } from "@/lib/types/database.types";

type HybridizedItem = Database["public"]["Tables"]["bands"]["Row"] & {
  episodes?: Database["public"]["Tables"]["episodes"]["Row"][];
};

interface HomeClientProps {
  items: HybridizedItem[];
  currentArtist?: string;
  artistBio?: string;
  artistCoverUrl?: string;
  soundcloudUrl?: string;
}

// Extend Window interface for SoundCloud Widget API
declare global {
  interface Window {
    SC: {
      Widget: {
        (iframe: HTMLIFrameElement): {
          bind: (event: string, callback: () => void) => void;
          pause: () => void;
        };
      };
    };
  }
}

export function HomeClient({
  items,
  currentArtist,
  artistBio,
  artistCoverUrl,
  soundcloudUrl,
}: HomeClientProps) {
  const { isPlaying, pauseAudio } = useAudioPlayer();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Flatten all episodes from all bands
  const allEpisodes = items.flatMap((band) =>
    (band.episodes || []).map((episode) => ({
      ...episode,
      bandName: band.name,
      bandCoverUrl: band.cover_url,
    })),
  );

  // Get SoundCloud embed URL without visual header
  const getSoundCloudEmbedUrl = (url: string) => {
    const encodedUrl = encodeURIComponent(url);
    return `https://w.soundcloud.com/player/?url=${encodedUrl}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`;
  };

  // If SoundCloud URL exists and no episodes, show SoundCloud embed only
  const showSoundCloudOnly = soundcloudUrl && allEpisodes.length === 0;

  // Load SoundCloud Widget API and setup bidirectional pause control
  useEffect(() => {
    if (!showSoundCloudOnly || !iframeRef.current) return;

    // Load SoundCloud Widget API
    const script = document.createElement("script");
    script.src = "https://w.soundcloud.com/player/api.js";
    script.async = true;

    script.onload = () => {
      if (iframeRef.current && window.SC) {
        const widget = window.SC.Widget(iframeRef.current);

        // Register widget with global manager
        soundCloudManager.setWidget(widget);

        // Listen for play events from SoundCloud
        widget.bind("play", () => {
          // Pause the global audio player when SoundCloud starts playing
          pauseAudio();
        });
      }
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      soundCloudManager.clearWidget();
    };
  }, [showSoundCloudOnly, pauseAudio]);

  // Pause SoundCloud when global audio player starts
  useEffect(() => {
    if (isPlaying) {
      soundCloudManager.pause();
    }
  }, [isPlaying]);

  return (
    <main className="h-full flex flex-col lg:flex-row gap-6 p-4 md:p-6 min-h-0">
      {/* Main Content Panel - 65% */}
      <div className="w-full lg:w-[65%] flex flex-col min-h-0">
        {showSoundCloudOnly ? (
          <div className="relative flex-1 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 rounded-lg overflow-hidden border border-white/10 shadow-2xl">
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-blue-500/5 pointer-events-none" />

            {/* Iframe container - fills all available space */}
            <iframe
              ref={iframeRef}
              width="100%"
              height="100%"
              scrolling="no"
              frameBorder="no"
              allow="autoplay"
              src={getSoundCloudEmbedUrl(soundcloudUrl)}
              className="w-full h-full relative z-10"
              title={`${currentArtist} on SoundCloud`}
            />

            {/* Bottom gradient fade */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-20" />
          </div>
        ) : (
          <div className="space-y-6 overflow-y-auto pr-2">
            {allEpisodes.map((episode) => (
              <IframePlayer
                key={episode.id}
                episode={episode}
                artist={currentArtist || "Hybrid"}
              />
            ))}

            {allEpisodes.length === 0 && !soundcloudUrl && (
              <div className="bg-[#181818] rounded-lg p-12 text-center border border-white/5">
                <p className="text-white/50">
                  No episodes available for this artist
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar Panel - 35% */}
      <aside className="w-full lg:w-[35%] overflow-y-auto">
        <ArtistProfile
          artist={{
            name: currentArtist || "Hybrid",
            bio:
              artistBio ||
              `${currentArtist || "Hybrid"} brings you cutting-edge electronic music with hardware-accelerated audio processing for the ultimate listening experience.`,
            coverUrl: artistCoverUrl || items[0]?.cover_url || undefined,
          }}
        />
      </aside>
    </main>
  );
}
