"use client";

import { ArtistProfile } from "@/components/artist-profile";
import { IframePlayer } from "@/components/iframe-player";
import { StaggerContainer, StaggerItem } from "@/components/page-transition";
import { useAudioPlayer } from "@/lib/audio-player-context";
import { soundCloudManager } from "@/lib/soundcloud-widget-manager";
import { motion } from "framer-motion";
import { Disc3, ExternalLink } from "lucide-react";
import { useEffect, useRef } from "react";

import type { ArtistBand, ArtistEpisode } from "./[artist]/page";

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

type HybridizedItem = ArtistBand & {
  episodes?: ArtistEpisode[];
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
    <div className="flex h-full min-h-0 flex-col gap-6 lg:flex-row">
      {/* Main Content Panel - 65% */}
      <div className="flex min-h-0 w-full flex-col lg:w-[65%] lg:overflow-hidden">
        {!showSoundCloudOnly && allEpisodes.length > 0 && (
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Latest episodes
              </p>
              <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-foreground">
                {currentArtist}
                <span className="ml-2 rounded-full border border-border bg-muted px-2.5 py-0.5 align-middle text-xs font-semibold text-muted-foreground tabular-nums">
                  {allEpisodes.length}
                </span>
              </h2>
            </div>
          </div>
        )}
        {showSoundCloudOnly ? (
          <div className="glass flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-3xl">
            {/* SoundCloud frame header */}
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  SoundCloud
                </p>
                <p className="truncate font-display text-sm font-bold text-foreground">
                  {currentArtist}
                </p>
              </div>
              <a
                href={soundcloudUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm shrink-0"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Open
              </a>
            </div>

            {/* Iframe container - fills all available space */}
            <div className="relative min-h-[380px] flex-1">
              <iframe
                ref={iframeRef}
                width="100%"
                height="100%"
                scrolling="no"
                frameBorder="no"
                allow="autoplay"
                src={getSoundCloudEmbedUrl(soundcloudUrl)}
                className="absolute inset-0 h-full w-full"
                title={`${currentArtist} on SoundCloud`}
              />
            </div>
          </div>
        ) : (
          // The sets scroll in this panel, not with the page: on a desktop
          // the panel is a fixed-height region, so the list needs
          // `min-h-0` to be allowed to shrink and scroll inside it.
          <div className="scrollbar-thin space-y-3 pr-1 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            <StaggerContainer stagger={0.04} delayChildren={0.05} className="space-y-3">
              {allEpisodes.map((episode, index) => (
                <StaggerItem key={episode.id} custom={index}>
                  <motion.div
                    variants={itemVariants}
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <IframePlayer episode={episode} artist={currentArtist ?? ""} index={index} />
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>

            {allEpisodes.length === 0 && !soundcloudUrl && (
              <motion.div
                className="glass p-12 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-border">
                  <Disc3 className="h-7 w-7 text-primary" aria-hidden="true" />
                </span>
                <h3 className="font-display text-lg font-bold text-foreground">No episodes yet</h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  {currentArtist
                    ? `New mixes from ${currentArtist} will appear here as soon as they're published.`
                    : "No episodes available for this artist."}
                </p>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar Panel - 35% */}
      {/* It fills the row and scrolls inside it, so a long artist profile is
          never cut off by the bottom of the pane. */}
      <aside className="w-full scrollbar-thin lg:h-full lg:w-[35%] lg:overflow-y-auto">
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
    </div>
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
