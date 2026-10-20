"use client";

import { GpuAudioVisualizer } from "@/components/gpu-audio-visualizer";
import { useHardwareAudio } from "@/hooks/use-hardware-audio";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface EnhancedAudioPlayerProps {
  src: string;
  title?: string;
  className?: string;
  loop?: boolean;
}

export function EnhancedAudioPlayer({
  src,
  title,
  className = "",
  loop = false,
}: EnhancedAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const {
    initializeAudioContext,
    setVolume: setHardwareVolume,
    analyserRef,
    resume,
    isInitialized,
  } = useHardwareAudio({
    enableHardwareAcceleration: true,
    sampleRate: 48000,
    latencyHint: "playback",
  });

  // Initialize audio context on mount
  useEffect(() => {
    if (audioRef.current && !isInitialized) {
      initializeAudioContext(audioRef.current);
    }
  }, [initializeAudioContext, isInitialized]);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      await resume();
      await audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setHardwareVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    handleVolumeChange(newMuted ? 0 : volume);
  };

  return (
    <div
      className={`rounded-lg border border-white/10 bg-linear-to-br from-purple-900/20 via-black/40 to-blue-900/20 p-4 backdrop-blur-sm ${className}`}
    >
      {title && <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>}

      {/* biome-ignore lint/a11y/useMediaCaption: no caption track exists for streamed audio */}
      <audio ref={audioRef} src={src} preload="auto" loop={loop} />

      <GpuAudioVisualizer
        analyser={analyserRef.current}
        isPlaying={isPlaying}
        className="mb-3 aspect-[4/1] max-h-24 w-full rounded"
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="rounded-full bg-linear-to-r from-purple-500 to-pink-500 p-2 text-white transition-all hover:scale-105 hover:from-purple-600 hover:to-pink-600"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>

        <button
          type="button"
          onClick={toggleMute}
          className="text-white/70 transition-colors hover:text-white"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={(e) => handleVolumeChange(Number.parseFloat(e.target.value))}
          className="flex-1 accent-purple-500"
          aria-label="Volume"
        />
      </div>

      {isInitialized && (
        <p className="mt-2 text-xs text-white/50">Hardware-accelerated audio enabled</p>
      )}
    </div>
  );
}
