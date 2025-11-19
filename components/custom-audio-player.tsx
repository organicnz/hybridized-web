"use client";

import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";

interface CustomAudioPlayerProps {
  src: string;
  autoPlay?: boolean;
  volume: number;
  onVolumeChange: (volume: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (time: number) => void;
  onEnded?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  showSkipControls?: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  initialTime?: number;
}

export function CustomAudioPlayer({
  src,
  autoPlay = false,
  volume,
  onVolumeChange,
  onPlay,
  onPause,
  onTimeUpdate,
  onEnded,
  onNext,
  onPrevious,
  showSkipControls = false,
  audioRef,
  initialTime = 0,
}: CustomAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const internalAudioRef = useRef<HTMLAudioElement>(null);

  // Sync internal ref with external ref
  useEffect(() => {
    if (internalAudioRef.current) {
      audioRef.current = internalAudioRef.current;
      console.log("Audio element set:", internalAudioRef.current);
    }
  }, [audioRef]);

  // Update volume when it changes
  useEffect(() => {
    if (internalAudioRef.current) {
      internalAudioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const audio = internalAudioRef.current;
    if (!audio) return;

    audio.volume = volume;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      if (initialTime > 0 && audio.duration >= initialTime) {
        audio.currentTime = initialTime;
        setCurrentTime(initialTime);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    if (autoPlay) {
      audio.play().catch((error) => {
        console.error("Autoplay failed:", error);
        setIsPlaying(false);
      });
    }

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [src, autoPlay, initialTime]);

  const togglePlay = () => {
    const audio = internalAudioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((error) => {
        console.error("Play failed:", error);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = internalAudioRef.current;
    if (!audio) return;

    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const skip = (seconds: number) => {
    const audio = internalAudioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(
      0,
      Math.min(audio.duration, audio.currentTime + seconds),
    );
  };

  const toggleMute = () => {
    const audio = internalAudioRef.current;
    if (!audio) return;

    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audio.muted = newMuted;
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3 w-full">
      <audio
        ref={internalAudioRef}
        src={src}
        preload="metadata"
        crossOrigin="anonymous"
      />

      {/* Controls */}
      <div className="flex items-center gap-2">
        {showSkipControls && (
          <button
            onClick={onPrevious}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Previous"
          >
            <SkipBack size={20} />
          </button>
        )}

        <button
          onClick={() => skip(-10)}
          className="text-white/70 hover:text-white transition-colors text-xs"
          aria-label="Rewind 10 seconds"
        >
          -10s
        </button>

        <button
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-white hover:bg-white/90 flex items-center justify-center transition-colors"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause size={18} className="text-black" fill="currentColor" />
          ) : (
            <Play size={18} className="text-black ml-0.5" fill="currentColor" />
          )}
        </button>

        <button
          onClick={() => skip(10)}
          className="text-white/70 hover:text-white transition-colors text-xs"
          aria-label="Forward 10 seconds"
        >
          +10s
        </button>

        {showSkipControls && (
          <button
            onClick={onNext}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Next"
          >
            <SkipForward size={20} />
          </button>
        )}
      </div>

      {/* Time */}
      <span className="text-xs text-white/50 tabular-nums">
        {formatTime(currentTime)}
      </span>

      {/* Progress Bar */}
      <div className="flex-1 min-w-0">
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="w-full accent-white h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, white 0%, white ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) 100%)`,
          }}
          aria-label="Seek"
        />
      </div>

      {/* Duration */}
      <span className="text-xs text-white/50 tabular-nums">
        {formatTime(duration)}
      </span>
    </div>
  );
}
