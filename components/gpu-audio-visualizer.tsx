"use client";

import { BAR_COUNT, computeBars } from "@/lib/vgpu/spectrum";
import { isWebGpuSupportedSync } from "@/lib/webgpu";
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
  const handleRef = useRef<{
    dispose: () => void;
    pause: () => void;
    resume: () => void;
    setBars: (bars: Float32Array) => void;
  } | null>(null);
  const [renderer, setRenderer] = useState<Renderer | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Early WebGPU detection — avoids the dynamic import on unsupported browsers
  const webgpuSupported = isWebGpuSupportedSync().available;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser || !webgpuSupported) return;

    let cancelled = false;
    let frame = 0;

    void (async () => {
      try {
        const { startGpuVisualizer } = await import("@/lib/vgpu/audio-visualizer");
        const { handle } = await startGpuVisualizer(canvas, {
          onError: () => {
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
  }, [analyser, webgpuSupported]);

  // Responsive canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resizeObserverRef.current = ro;

    return () => ro.disconnect();
  }, []);

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
    <div aria-hidden="true" className="contents">
      <canvas
        ref={canvasRef}
        className={className}
        data-renderer={renderer ?? "pending"}
      />
    </div>
  );
}
