"use client";

import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface CustomAudioPlayerProps {
  src: string;
  autoPlay?: boolean;
  volume: number;
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
    }
  }, [audioRef]);

  // Update volume when it changes
  useEffect(() => {
    if (internalAudioRef.current) {
      internalAudioRef.current.volume = volume;
    }
  }, [volume]);

  // Separate effect for event listeners
  useEffect(() => {
    const audio = internalAudioRef.current;
    if (!audio) return;

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

    const handleError = () => {
      // Audio error occurred - user will see playback stop
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("error", handleError);
    };
  }, [initialTime, onTimeUpdate, onEnded, onPlay, onPause]);

  // Separate effect for autoplay - only runs when src changes
  useEffect(() => {
    const audio = internalAudioRef.current;
    if (!audio || !autoPlay) return;

    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.catch(() => {
        setIsPlaying(false);
      });
    }
  }, [autoPlay]);

  const togglePlay = () => {
    const audio = internalAudioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {
        // Play failed - user will see button state unchanged
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = internalAudioRef.current;
    if (!audio) return;

    const time = Number.parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const skip = (seconds: number) => {
    const audio = internalAudioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
  };

  const _toggleMute = () => {
    const audio = internalAudioRef.current;
    if (!audio) return;

    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audio.muted = newMuted;
  };

  const formatTime = (time: number) => {
    if (Number.isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex w-full items-center gap-2 sm:gap-3">
      {/* biome-ignore lint/a11y/useMediaCaption: no caption track exists for user-uploaded audio */}
      <audio ref={internalAudioRef} src={src} preload="auto" crossOrigin="anonymous" playsInline />

      {/* Controls */}
      <div className="flex items-center gap-1 sm:gap-2">
        {showSkipControls && (
          <button
            type="button"
            onClick={onPrevious}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Previous"
          >
            <SkipBack size={18} />
          </button>
        )}

        <button
          type="button"
          onClick={() => skip(-10)}
          className="rounded-lg px-1.5 py-1 font-mono text-[11px] font-medium tabular-nums text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Rewind 10 seconds"
        >
          -10s
        </button>

        <button
          type="button"
          onClick={togglePlay}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow transition-all duration-200 hover:scale-105 hover:bg-primary/90 active:scale-95"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause size={17} fill="currentColor" />
          ) : (
            <Play size={17} className="ml-0.5" fill="currentColor" />
          )}
        </button>

        <button
          type="button"
          onClick={() => skip(10)}
          className="rounded-lg px-1.5 py-1 font-mono text-[11px] font-medium tabular-nums text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Forward 10 seconds"
        >
          +10s
        </button>

        {showSkipControls && (
          <button
            type="button"
            onClick={onNext}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Next"
          >
            <SkipForward size={18} />
          </button>
        )}
      </div>

      {/* Time */}
      <span className="hidden font-mono text-[11px] tabular-nums text-muted-foreground sm:inline">
        {formatTime(currentTime)}
      </span>

      {/* Progress Bar */}
      <div className="min-w-0 flex-1">
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="slider-polished w-full"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${(currentTime / duration) * 100 || 0}%, hsl(var(--muted)) ${(currentTime / duration) * 100 || 0}%, hsl(var(--muted)) 100%)`,
          }}
          aria-label="Seek"
        />
      </div>

      {/* Duration */}
      <span className="hidden font-mono text-[11px] tabular-nums text-muted-foreground sm:inline">
        {formatTime(duration)}
      </span>
    </div>
  );
}
