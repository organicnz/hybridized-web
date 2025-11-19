"use client";

import { useAudioPlayer } from "@/lib/audio-player-context";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import Image from "next/image";
import { X } from "lucide-react";
import { useRef, useEffect, useState } from "react";

export function AudioPlayerBar() {
  const {
    currentTrack,
    setCurrentTrack,
    playNext,
    playPrevious,
    playlist,
    currentTime,
    setCurrentTime,
    shouldAutoPlay,
    isPlaying,
    setIsPlaying,
    audioRef,
  } = useAudioPlayer();

  const playerRef = useRef<AudioPlayer>(null);

  // Sync audioRef with the actual audio element
  useEffect(() => {
    if (playerRef.current?.audio?.current && audioRef) {
      (audioRef as React.MutableRefObject<HTMLAudioElement>).current =
        playerRef.current.audio.current;
    }
  }, [playerRef.current?.audio?.current, audioRef]);
  const [hasRestoredPosition, setHasRestoredPosition] = useState(false);

  // Reset position restoration flag when track changes
  useEffect(() => {
    if (currentTrack) {
      setHasRestoredPosition(false);
    }
  }, [currentTrack?.id]);

  // Restore playback position when track loads
  useEffect(() => {
    if (
      playerRef.current?.audio?.current &&
      currentTime > 0 &&
      !hasRestoredPosition
    ) {
      const audio = playerRef.current.audio.current;

      const handleLoadedMetadata = () => {
        if (audio.duration >= currentTime) {
          audio.currentTime = currentTime;
          setHasRestoredPosition(true);

          // Pause immediately if we shouldn't autoplay
          if (!shouldAutoPlay) {
            audio.pause();
          }
        }
      };

      if (audio.readyState >= 1) {
        handleLoadedMetadata();
      } else {
        audio.addEventListener("loadedmetadata", handleLoadedMetadata);
        return () =>
          audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      }
    }
  }, [currentTrack?.id, currentTime, hasRestoredPosition, shouldAutoPlay]);

  // Save current time and playing state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current?.audio?.current) {
        const audio = playerRef.current.audio.current;
        const time = audio.currentTime;
        const playing = !audio.paused;

        if (time > 0) {
          setCurrentTime(time);
        }
        if (playing !== isPlaying) {
          setIsPlaying(playing);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [setCurrentTime, setIsPlaying, isPlaying]);

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#181818] border-t border-white/10 z-50">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex items-center gap-4">
          {/* Track info */}
          <div className="flex items-center gap-3 min-w-0 w-64">
            {currentTrack.coverUrl && (
              <Image
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                width={56}
                height={56}
                className="rounded flex-shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-white font-medium truncate text-sm">
                {currentTrack.title}
              </h3>
              <p className="text-white/60 text-xs truncate">
                {currentTrack.artist}
              </p>
            </div>
          </div>

          {/* Audio Player */}
          <div className="flex-1">
            <AudioPlayer
              ref={playerRef}
              src={currentTrack.audioUrl}
              autoPlay={shouldAutoPlay}
              showJumpControls
              showSkipControls={playlist.length > 1}
              onClickNext={playNext}
              onClickPrevious={playPrevious}
              onEnded={playNext}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onListen={(e) => {
                const target = e.target as HTMLAudioElement;
                setCurrentTime(target.currentTime);
              }}
              customAdditionalControls={[]}
              layout="horizontal-reverse"
              className="spotify-player"
              preload="auto"
            />
          </div>

          {/* Close button */}
          <button
            onClick={() => setCurrentTrack(null)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Close player"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
