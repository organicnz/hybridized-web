"use client";

import { useState, useEffect } from "react";
import { Play } from "lucide-react";
import { useAudioPlayer } from "@/lib/audio-player-context";
import { createClient } from "@/lib/supabase/client";
import { AuthRequiredModal } from "./auth-required-modal";
import type { Database } from "@/lib/types/database.types";

type Episode = Database["public"]["Tables"]["episodes"]["Row"] & {
  bandName?: string | null;
  bandCoverUrl?: string | null;
};

interface IframePlayerProps {
  episode: Episode;
  artist: string;
}

export function IframePlayer({ episode, artist }: IframePlayerProps) {
  const { playPlaylist } = useAudioPlayer();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handlePlayClick = async () => {
    // Check authentication
    if (isAuthenticated === false) {
      setShowAuthModal(true);
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

  const coverUrl = episode.cover_url || episode.bandCoverUrl;

  return (
    <>
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      <div className="relative w-full rounded-lg border border-white/10 overflow-hidden bg-[#181818] hover:bg-[#282828] transition-colors group">
        <div className="flex items-center gap-3 p-3">
          {/* Episode Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white text-sm font-medium truncate">
              {episode.title || "Untitled"}
            </h3>
          </div>

          {/* Play Button */}
          <button
            onClick={handlePlayClick}
            className="w-10 h-10 rounded-full bg-[#1DB954] hover:bg-[#1ed760] hover:scale-105 flex items-center justify-center transition-all shadow-lg flex-shrink-0"
            aria-label={`Play ${episode.title || "episode"}`}
          >
            <Play
              className="w-4 h-4 text-black ml-0.5"
              fill="currentColor"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </>
  );
}
