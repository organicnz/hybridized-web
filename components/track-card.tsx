"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import { useAudioPlayer, type Track } from "@/lib/audio-player-context";

interface TrackCardProps {
  track: Track;
}

export function TrackCard({ track }: TrackCardProps) {
  const { currentTrack, setCurrentTrack } = useAudioPlayer();
  const isPlaying = currentTrack?.id === track.id;

  return (
    <div className="bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors group">
      <div className="relative aspect-square mb-4">
        {track.coverUrl && (
          <Image
            src={track.coverUrl}
            alt={track.title}
            fill
            className="object-cover rounded"
          />
        )}
        <button
          onClick={() => setCurrentTrack(track)}
          className={`absolute bottom-2 right-2 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isPlaying
              ? "bg-[#1DB954] opacity-100"
              : "bg-[#1DB954] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
          }`}
          aria-label={`Play ${track.title}`}
        >
          <Play className="w-5 h-5 text-black" fill="currentColor" />
        </button>
      </div>
      <h3 className="text-white font-semibold truncate mb-1">{track.title}</h3>
      <p className="text-white/60 text-sm truncate">{track.artist}</p>
    </div>
  );
}
