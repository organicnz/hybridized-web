"use client";

import { useRef, useEffect, useState } from "react";
import { useHardwareAudio } from "@/hooks/use-hardware-audio";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface EnhancedAudioPlayerProps {
  src: string;
  title?: string;
  className?: string;
}

export function EnhancedAudioPlayer({
  src,
  title,
  className = "",
}: EnhancedAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const {
    initializeAudioContext,
    setVolume: setHardwareVolume,
    getFrequencyData,
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

    // Cleanup on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initializeAudioContext, isInitialized]);

  // Visualizer animation with performance optimization
  useEffect(() => {
    if (!isPlaying || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const draw = () => {
      const frequencyData = getFrequencyData();
      if (!frequencyData) return;

      const width = canvas.width;
      const height = canvas.height;
      const barWidth = (width / frequencyData.length) * 2.5;

      ctx.clearRect(0, 0, width, height);

      frequencyData.forEach((value, index) => {
        const barHeight = (value / 255) * height * 0.8;
        const x = index * barWidth;
        const y = height - barHeight;

        // Gradient for bars
        const gradient = ctx.createLinearGradient(0, y, 0, height);
        gradient.addColorStop(0, "rgba(168, 85, 247, 0.8)");
        gradient.addColorStop(0.5, "rgba(236, 72, 153, 0.6)");
        gradient.addColorStop(1, "rgba(59, 130, 246, 0.4)");

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth - 1, barHeight);
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, getFrequencyData]);

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
      className={`bg-gradient-to-br from-purple-900/20 via-black/40 to-blue-900/20 backdrop-blur-sm border border-white/10 rounded-lg p-4 ${className}`}
    >
      {title && (
        <h3 className="text-white font-semibold mb-3 text-sm">{title}</h3>
      )}

      <audio ref={audioRef} src={src} preload="auto" crossOrigin="anonymous" />

      <canvas
        ref={canvasRef}
        width={300}
        height={60}
        className="w-full h-15 mb-3 rounded"
      />

      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white p-2 rounded-full transition-all hover:scale-105"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>

        <button
          onClick={toggleMute}
          className="text-white/70 hover:text-white transition-colors"
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
          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
          className="flex-1 accent-purple-500"
          aria-label="Volume"
        />
      </div>

      {isInitialized && (
        <p className="text-xs text-white/50 mt-2">
          Hardware-accelerated audio enabled
        </p>
      )}
    </div>
  );
}
