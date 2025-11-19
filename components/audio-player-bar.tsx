"use client";

import { useAudioPlayer } from "@/lib/audio-player-context";
import Image from "next/image";
import { X, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { AudioEqualizer } from "./audio-equalizer";
import { CustomAudioPlayer } from "./custom-audio-player";

export function AudioPlayerBar() {
  const {
    currentTrack,
    setCurrentTrack,
    playNext,
    playPrevious,
    playlist,
    currentTime,
    setCurrentTime,
    volume,
    setVolume,
    shouldAutoPlay,
    setIsPlaying,
    audioRef,
  } = useAudioPlayer();

  const [isMuted, setIsMuted] = useState(false);

  // Debug log
  console.log(
    "AudioPlayerBar render - currentTrack:",
    currentTrack,
    "shouldAutoPlay:",
    shouldAutoPlay,
  );

  const toggleMute = () => {
    if (!audioRef?.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioRef.current.muted = newMuted;
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef?.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
      if (audioRef?.current) {
        audioRef.current.muted = false;
      }
    }
  };

  if (!currentTrack) {
    console.log("AudioPlayerBar: No current track, not rendering");
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Glassmorphism background with gradient */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/95 via-purple-900/20 to-transparent backdrop-blur-xl border-t border-white/10"
        style={{ transform: "translateZ(0)", willChange: "transform" }}
      />

      {/* Animated gradient overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-blue-500/5 animate-pulse"
        style={{ transform: "translateZ(0)" }}
      />

      <div className="relative max-w-7xl mx-auto p-4">
        <div className="flex items-center gap-4">
          {/* Track info with glassmorphism */}
          <div
            className="flex items-center gap-3 min-w-0 flex-1 max-w-md px-3 py-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg"
            style={{ transform: "translateZ(0)", willChange: "transform" }}
          >
            {currentTrack.coverUrl && (
              <div
                className="relative flex-shrink-0 rounded-lg overflow-hidden shadow-xl ring-2 ring-white/10"
                style={{ transform: "translateZ(0)" }}
              >
                <Image
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  width={56}
                  height={56}
                  className="rounded-lg"
                />
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-white font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis drop-shadow-lg">
                {currentTrack.title}
              </h3>
              <p className="text-white/60 text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                {currentTrack.artist}
              </p>
            </div>
          </div>

          {/* Audio Player with glassmorphism */}
          <div
            className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-md border border-white/10 shadow-2xl"
            style={{ transform: "translateZ(0)", willChange: "transform" }}
          >
            {audioRef && (
              <CustomAudioPlayer
                src={currentTrack.audioUrl}
                autoPlay={shouldAutoPlay}
                volume={volume}
                onVolumeChange={setVolume}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={setCurrentTime}
                onEnded={playNext}
                onNext={playNext}
                onPrevious={playPrevious}
                showSkipControls={playlist.length > 1}
                audioRef={audioRef as React.RefObject<HTMLAudioElement | null>}
                initialTime={currentTime}
              />
            )}
          </div>

          {/* Right Controls Section with glassmorphism */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Volume Control */}
            <div
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
              style={{ transform: "translateZ(0)", willChange: "transform" }}
            >
              <button
                onClick={toggleMute}
                className="text-white/70 hover:text-white transition-all duration-200 flex-shrink-0 hover:scale-110"
                style={{ transform: "translateZ(0)" }}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX size={18} />
                ) : (
                  <Volume2 size={18} />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-24 accent-purple-500 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer transition-all"
                style={{
                  background: `linear-gradient(to right, rgb(168 85 247) 0%, rgb(168 85 247) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.1) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.1) 100%)`,
                  transform: "translateZ(0)",
                  willChange: "transform",
                }}
                aria-label="Volume"
              />
            </div>

            {/* Divider with glow */}
            <div className="h-10 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent flex-shrink-0" />

            {/* Equalizer */}
            {audioRef && <AudioEqualizer audioRef={audioRef} />}

            {/* Divider with glow */}
            <div className="h-10 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent flex-shrink-0" />

            {/* Close button with glassmorphism */}
            <button
              onClick={() => setCurrentTrack(null)}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/10 backdrop-blur-md border border-white/20 hover:border-red-400/50 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-red-500/30 flex-shrink-0 group"
              style={{ transform: "translateZ(0)", willChange: "transform" }}
              aria-label="Close player"
            >
              <X className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
