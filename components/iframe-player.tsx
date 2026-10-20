"use client";

import { useAudioPlayer } from "@/lib/audio-player-context";
import { getSupabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/types/database.types";
import { cn } from "@/lib/utils";
import { CalendarDays, Clock3, Play } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AuthRequiredModal } from "./auth-required-modal";

type Episode = Database["public"]["Tables"]["episodes"]["Row"] & {
  bandName?: string | null;
  bandCoverUrl?: string | null;
};

interface IframePlayerProps {
  episode: Episode;
  artist: string;
  index?: number;
}

function formatDuration(totalSeconds: number | null): string | null {
  if (totalSeconds === null || Number.isNaN(totalSeconds) || totalSeconds <= 0) return null;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  if (hours > 0)
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function IframePlayer({ episode, artist, index }: IframePlayerProps) {
  const { playPlaylist } = useAudioPlayer();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const supabase = await getSupabase();
      if (cancelled) return;

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsAuthenticated(!!session?.user);
      });

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!cancelled) setIsAuthenticated(!!user);
      } catch {
        if (!cancelled) setIsAuthenticated(false);
      }

      return () => subscription.unsubscribe();
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handlePlayClick = async () => {
    // Check authentication
    if (isAuthenticated === false) {
      setShowAuthModal(true);
      return;
    }

    // Check if audio URL exists
    if (!episode.audio_url) {
      console.error("No audio URL for episode:", episode.title);
      return;
    }

    // Create a single track from this episode
    const track = {
      id: `episode-${episode.id}`,
      title: episode.title || "Untitled",
      artist: artist,
      audioUrl: episode.audio_url,
      coverUrl: episode.cover_url || episode.bandCoverUrl || undefined,
    };

    // Play immediately as a single-track playlist
    playPlaylist([track], 0);
  };

  const coverUrl = episode.cover_url || episode.bandCoverUrl || undefined;
  const duration = formatDuration(episode.duration);
  const pubDate = formatDate(episode.pub_date);

  return (
    <>
      {showAuthModal && <AuthRequiredModal isOpen onClose={() => setShowAuthModal(false)} />}
      <div className="glass group relative w-full overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow">
        <div className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
          {/* Index / cover */}
          {typeof index === "number" ? (
            <span
              className="hidden w-7 shrink-0 text-center font-display text-sm font-bold text-muted-foreground/60 tabular-nums sm:block"
              aria-hidden="true"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
          ) : null}
          {coverUrl ? (
            <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-border sm:h-14 sm:w-14">
              <Image
                src={coverUrl}
                alt=""
                width={56}
                height={56}
                className="h-full w-full object-cover"
              />
            </span>
          ) : (
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-purple-500/25 via-pink-500/20 to-blue-500/25 font-display text-lg font-bold text-primary ring-1 ring-border sm:h-14 sm:w-14"
              aria-hidden="true"
            >
              {(episode.title || "H").charAt(0).toUpperCase()}
            </span>
          )}

          {/* Episode Info */}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-foreground sm:text-[15px]">
              {episode.title || "Untitled"}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              {duration ? (
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  {duration}
                </span>
              ) : null}
              {pubDate ? (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  {pubDate}
                </span>
              ) : null}
              {episode.bandName ? (
                <span className="hidden truncate sm:inline">{episode.bandName}</span>
              ) : null}
            </div>
          </div>

          {/* Play Button — Spotify green kept intentionally */}
          <button
            type="button"
            onClick={handlePlayClick}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
              "bg-[#1DB954] text-black shadow-lg shadow-[#1DB954]/25",
              "transition-all duration-200 hover:scale-105 hover:bg-[#1ed760] hover:shadow-xl hover:shadow-[#1DB954]/35",
              "focus-visible:ring-2 focus-visible:ring-[#1DB954] focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-hidden active:scale-95",
            )}
            aria-label={`Play ${episode.title || "episode"}`}
          >
            <Play className="ml-0.5 h-4 w-4" fill="currentColor" aria-hidden="true" />
          </button>
        </div>
      </div>
    </>
  );
}
