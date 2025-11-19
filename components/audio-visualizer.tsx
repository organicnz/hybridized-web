"use client";

import { useRef, useEffect, useState } from "react";
import { useAudioVisualizer } from "@/hooks/use-audio-visualizer";
import { BarChart3, Activity, Radio } from "lucide-react";

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  className?: string;
}

type VisualizerType = "bars" | "waveform" | "circular";

export function AudioVisualizer({
  analyser,
  isPlaying,
  className = "",
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visualizerType, setVisualizerType] = useState<VisualizerType>("bars");
  const { startAnimation, stopAnimation } = useAudioVisualizer(analyser);

  useEffect(() => {
    if (!canvasRef.current || !isPlaying) {
      stopAnimation();
      return;
    }

    startAnimation(canvasRef.current, visualizerType);

    return () => {
      stopAnimation();
    };
  }, [isPlaying, visualizerType, startAnimation, stopAnimation]);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white/90">
          Audio Visualizer
        </h4>
        <div className="flex gap-1">
          <button
            onClick={() => setVisualizerType("bars")}
            className={`p-2 rounded transition-colors ${
              visualizerType === "bars"
                ? "bg-purple-500/30 text-purple-300"
                : "bg-white/5 text-white/50 hover:bg-white/10"
            }`}
            aria-label="Bar visualizer"
          >
            <BarChart3 size={16} />
          </button>
          <button
            onClick={() => setVisualizerType("waveform")}
            className={`p-2 rounded transition-colors ${
              visualizerType === "waveform"
                ? "bg-purple-500/30 text-purple-300"
                : "bg-white/5 text-white/50 hover:bg-white/10"
            }`}
            aria-label="Waveform visualizer"
          >
            <Activity size={16} />
          </button>
          <button
            onClick={() => setVisualizerType("circular")}
            className={`p-2 rounded transition-colors ${
              visualizerType === "circular"
                ? "bg-purple-500/30 text-purple-300"
                : "bg-white/5 text-white/50 hover:bg-white/10"
            }`}
            aria-label="Circular visualizer"
          >
            <Radio size={16} />
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={200}
        className="w-full h-32 md:h-40 rounded-lg bg-black/30"
      />
    </div>
  );
}
