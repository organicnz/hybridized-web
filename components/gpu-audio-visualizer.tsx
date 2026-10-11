"use client";

import { BAR_COUNT, computeBars } from "@/lib/vgpu/spectrum";
import { useEffect, useRef, useState } from "react";

interface GpuAudioVisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  className?: string;
  barCount?: number;
}

type Renderer = "gpu" | "canvas2d";

/**
 * WebGPU frequency-bar visualiser with a Canvas 2D fallback.
 *
 * The vgpu runtime is code-split and only fetched once playback starts, so
 * visitors who never press play never download the GPU runtime. The device is
 * paused (not torn down) between plays and disposed on unmount.
 */
export function GpuAudioVisualizer({
  analyser,
  isPlaying,
  className = "",
  barCount = BAR_COUNT,
}: GpuAudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barsRef = useRef<Float32Array>(new Float32Array(barCount));
  const handleRef = useRef<{ dispose: () => void; pause: () => void; resume: () => void } | null>(
    null,
  );
  const [renderer, setRenderer] = useState<Renderer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;

    let cancelled = false;
    let frame = 0;

    void (async () => {
      try {
        const { startGpuVisualizer } = await import("@/lib/vgpu/audio-visualizer");
        const { handle } = await startGpuVisualizer(canvas, {
          onError: () => {
            // Device lost or a frame failed validation: fall back rather than
            // leaving a frozen canvas behind.
            if (cancelled) return;
            cancelled = true;
            handleRef.current?.dispose();
            handleRef.current = null;
            setRenderer("canvas2d");
          },
        });
        if (cancelled) {
          handle.dispose();
          return;
        }

        handleRef.current = handle;
        setRenderer("gpu");
        handle.pause();

        const tick = () => {
          if (cancelled) return;
          handle.setBars(computeBars(analyser, barsRef.current));
          frame = requestAnimationFrame(tick);
        };

        handle.resume();
        tick();
      } catch {
        if (!cancelled) setRenderer("canvas2d");
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, [analyser]);

  useEffect(() => {
    const handle = handleRef.current;
    if (!handle || renderer !== "gpu") return;
    if (isPlaying) handle.resume();
    else handle.pause();
  }, [isPlaying, renderer]);

  useEffect(() => {
    if (renderer !== "canvas2d") return;
    const canvas = canvasRef.current;
    if (!canvas || !analyser || !isPlaying) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let frame = 0;
    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);

      const barWidth = width / barCount;
      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * data.length);
        const barHeight = (data[dataIndex] / 255) * height * 0.9;
        const x = i * barWidth;
        const y = height - barHeight;

        const gradient = ctx.createLinearGradient(x, y, x, height);
        gradient.addColorStop(0, "rgba(168, 85, 247, 0.9)");
        gradient.addColorStop(0.5, "rgba(236, 72, 153, 0.7)");
        gradient.addColorStop(1, "rgba(59, 130, 246, 0.5)");

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth - 2, barHeight);
      }

      frame = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(frame);
  }, [renderer, analyser, isPlaying, barCount]);

  return (
    // Decorative: the audio element carries the semantics, not the rendering.
    <div aria-hidden="true" className="contents">
      <canvas
        ref={canvasRef}
        width={800}
        height={200}
        className={className}
        data-renderer={renderer ?? "pending"}
      />
    </div>
  );
}
