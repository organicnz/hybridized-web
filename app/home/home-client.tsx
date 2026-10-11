"use client";

import { ArtistProfile } from "@/components/artist-profile";
import { IframePlayer } from "@/components/iframe-player";
import { useAudioPlayer } from "@/lib/audio-player-context";
import { soundCloudManager } from "@/lib/soundcloud-widget-manager";
import type { Database } from "@/lib/types/database.types";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { StaggerContainer, StaggerItem } from "@/components/page-transition";

// Extend Window interface for SoundCloud Widget API
declare global {
  interface Window {
    SC: {
      Widget: (iframe: HTMLIFrameElement) => {
        bind: (event: string, callback: () => void) => void;
        pause: () => void;
      };
    };
  }
}

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

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

export function HomeClient({
  items,
  currentArtist,
  artistBio,
  artistCoverUrl,
  soundcloudUrl,
}: HomeClientProps) {
  const { isPlaying, pauseAudio, saveInteraction } = useAudioPlayer();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Save artist selection to Supabase whenever it changes
  useEffect(() => {
    if (currentArtist) {
      saveInteraction({ last_artist: currentArtist });
    }
  }, [currentArtist, saveInteraction]);

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
          <div className="relative flex-1 rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-purple-900/30 via-black/80 to-blue-900/20 shadow-[0_20px_60px_-15px_rgba(124,58,237,0.2)] backdrop-blur-2xl">
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
          <div className="space-y-4 overflow-y-auto pr-2">
            <StaggerContainer stagger={0.04} delayChildren={0.05}>
              {allEpisodes.map((episode, index) => (
                <StaggerItem key={episode.id} custom={index}>
                  <motion.div
                    variants={itemVariants}
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <IframePlayer episode={episode} artist={currentArtist ?? ""} />
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>

            {allEpisodes.length === 0 && !soundcloudUrl && (
              <motion.div
                className="card-flat p-12 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <p className="text-muted-foreground">No episodes available for this artist</p>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar Panel - 35% */}
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: WCAG 2.1.1 requires a scrollable region with no focusable children to be keyboard-reachable (axe: scrollable-region-focusable) */}
      <aside className="w-full lg:w-[35%] overflow-y-auto" tabIndex={0}>
        <ArtistProfile
          artist={{
            name: currentArtist ?? "",
            bio:
              artistBio ||
              `${currentArtist ?? "This artist"} brings you cutting-edge electronic music with hardware-accelerated audio processing for the ultimate listening experience.`,
            coverUrl: artistCoverUrl || items[0]?.cover_url || undefined,
          }}
        />
      </aside>
    </main>
  );
}

// Extend Window interface for SoundCloud Widget API
declare global {
  interface Window {
    SC: {
      Widget: (iframe: HTMLIFrameElement) => {
        bind: (event: string, callback: () => void) => void;
        pause: () => void;
      };
    };
  }
}
