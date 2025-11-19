"use client";

import { useState } from "react";
import {
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  SkipBack,
  SkipForward,
} from "lucide-react";

interface AudioControlsPanelProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  volume: number;
  onVolumeChange: (volume: number) => void;
  className?: string;
}

export function AudioControlsPanel({
  audioRef,
  volume,
  onVolumeChange,
  className = "",
}: AudioControlsPanelProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const toggleMute = () => {
    if (!audioRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioRef.current.muted = newMuted;
  };

  const toggleLoop = () => {
    if (!audioRef.current) return;
    const newLoop = !isLooping;
    setIsLooping(newLoop);
    audioRef.current.loop = newLoop;
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (!audioRef.current) return;
    setPlaybackRate(rate);
    audioRef.current.playbackRate = rate;
  };

  const skip = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(
      0,
      audioRef.current.currentTime + seconds,
    );
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Skip Backward */}
      <button
        onClick={() => skip(-10)}
        className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/70 hover:text-white"
        aria-label="Skip backward 10 seconds"
      >
        <SkipBack size={18} />
      </button>

      {/* Volume Control */}
      <div className="flex items-center gap-2 flex-1 max-w-xs">
        <button
          onClick={toggleMute}
          className="text-white/70 hover:text-white transition-colors"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted || volume === 0 ? (
            <VolumeX size={20} />
          ) : (
            <Volume2 size={20} />
          )}
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={(e) => {
            const newVolume = parseFloat(e.target.value);
            onVolumeChange(newVolume);
            if (newVolume > 0 && isMuted) setIsMuted(false);
          }}
          className="flex-1 accent-purple-500 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, rgb(168 85 247) 0%, rgb(168 85 247) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.1) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.1) 100%)`,
          }}
          aria-label="Volume"
        />

        <span className="text-xs text-white/50 w-8 text-right">
          {Math.round((isMuted ? 0 : volume) * 100)}%
        </span>
      </div>

      {/* Skip Forward */}
      <button
        onClick={() => skip(10)}
        className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/70 hover:text-white"
        aria-label="Skip forward 10 seconds"
      >
        <SkipForward size={18} />
      </button>

      {/* Loop Toggle */}
      <button
        onClick={toggleLoop}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
          isLooping
            ? "bg-purple-500/30 text-purple-300"
            : "hover:bg-white/10 text-white/70 hover:text-white"
        }`}
        aria-label={isLooping ? "Disable loop" : "Enable loop"}
      >
        <Repeat size={18} />
      </button>

      {/* Playback Speed */}
      <div className="relative group">
        <button
          className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white/70 hover:text-white transition-colors font-mono"
          aria-label="Playback speed"
        >
          {playbackRate}x
        </button>

        <div className="absolute bottom-full right-0 mb-2 bg-zinc-900 border border-white/10 rounded-lg p-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity shadow-xl gpu-opacity">
          <div className="flex flex-col gap-1 min-w-[80px]">
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
              <button
                key={rate}
                onClick={() => handlePlaybackRateChange(rate)}
                className={`px-3 py-1 rounded text-xs transition-colors text-left ${
                  playbackRate === rate
                    ? "bg-purple-500/30 text-purple-300"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
