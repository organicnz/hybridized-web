"use client";

import { useEffect, useRef, useCallback } from "react";

interface VisualizerConfig {
  fftSize?: number;
  smoothingTimeConstant?: number;
  barCount?: number;
}

export function useAudioVisualizer(
  analyser: AnalyserNode | null,
  config: VisualizerConfig = {},
) {
  const animationRef = useRef<number | undefined>(undefined);
  const { fftSize = 2048, smoothingTimeConstant = 0.8, barCount = 64 } = config;

  const drawWaveform = useCallback(
    (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      if (!analyser) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(168, 85, 247, 0.8)";
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
    },
    [analyser],
  );

  const drawFrequencyBars = useCallback(
    (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      if (!analyser) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const barWidth = width / barCount;
      const barSpacing = 2;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const barHeight = (dataArray[dataIndex] / 255) * height * 0.9;
        const x = i * barWidth;
        const y = height - barHeight;

        // Gradient for each bar
        const gradient = ctx.createLinearGradient(x, y, x, height);
        gradient.addColorStop(0, "rgba(168, 85, 247, 0.9)");
        gradient.addColorStop(0.5, "rgba(236, 72, 153, 0.7)");
        gradient.addColorStop(1, "rgba(59, 130, 246, 0.5)");

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth - barSpacing, barHeight);
      }
    },
    [analyser, barCount],
  );

  const drawCircularVisualizer = useCallback(
    (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      if (!analyser) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const { width, height } = canvas;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 3;

      ctx.clearRect(0, 0, width, height);

      const bars = 128;
      const step = (Math.PI * 2) / bars;

      for (let i = 0; i < bars; i++) {
        const dataIndex = Math.floor((i / bars) * bufferLength);
        const barHeight = (dataArray[dataIndex] / 255) * radius * 0.8;
        const angle = step * i;

        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius + barHeight);

        const hue = (i / bars) * 360;
        ctx.strokeStyle = `hsla(${hue}, 70%, 60%, 0.8)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    },
    [analyser],
  );

  const startAnimation = useCallback(
    (
      canvas: HTMLCanvasElement,
      visualizerType: "bars" | "waveform" | "circular" = "bars",
    ) => {
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx || !analyser) return;

      const draw = () => {
        switch (visualizerType) {
          case "waveform":
            drawWaveform(canvas, ctx);
            break;
          case "circular":
            drawCircularVisualizer(canvas, ctx);
            break;
          case "bars":
          default:
            drawFrequencyBars(canvas, ctx);
            break;
        }

        animationRef.current = requestAnimationFrame(draw);
      };

      draw();
    },
    [analyser, drawWaveform, drawFrequencyBars, drawCircularVisualizer],
  );

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    if (analyser) {
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = smoothingTimeConstant;
    }
  }, [analyser, fftSize, smoothingTimeConstant]);

  useEffect(() => {
    return () => {
      stopAnimation();
    };
  }, [stopAnimation]);

  return {
    startAnimation,
    stopAnimation,
  };
}
