"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface AudioConfig {
  enableHardwareAcceleration?: boolean;
  sampleRate?: number;
  latencyHint?: "interactive" | "balanced" | "playback";
}

export function useHardwareAudio(config: AudioConfig = {}) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeAudioContext = useCallback(
    (audioElement: HTMLAudioElement) => {
      if (audioContextRef.current) return audioContextRef.current;

      // Create AudioContext with hardware acceleration hints
      const contextOptions: AudioContextOptions = {
        latencyHint: config.latencyHint || "playback",
        sampleRate: config.sampleRate || 48000, // Higher sample rate for better quality
      };

      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)(contextOptions);
      audioContextRef.current = audioContext;

      // Create audio nodes for processing
      const source = audioContext.createMediaElementSource(audioElement);
      const gainNode = audioContext.createGain();
      const analyser = audioContext.createAnalyser();

      // Configure analyser for visualization
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;

      // Connect the audio graph: source -> gain -> analyser -> destination
      source.connect(gainNode);
      gainNode.connect(analyser);
      analyser.connect(audioContext.destination);

      sourceNodeRef.current = source;
      gainNodeRef.current = gainNode;
      analyserRef.current = analyser;

      setIsInitialized(true);
      return audioContext;
    },
    [config.latencyHint, config.sampleRate],
  );

  const setVolume = useCallback((volume: number) => {
    if (gainNodeRef.current && audioContextRef.current) {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      // Smooth volume changes to prevent clicks/pops
      gainNodeRef.current.gain.setValueAtTime(
        clampedVolume,
        audioContextRef.current.currentTime,
      );
    }
  }, []);

  const getFrequencyData = useCallback(() => {
    if (!analyserRef.current) return null;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    return dataArray;
  }, []);

  const resume = useCallback(async () => {
    if (audioContextRef.current?.state === "suspended") {
      await audioContextRef.current.resume();
    }
  }, []);

  const cleanup = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch((err) => {
        console.warn("Error closing audio context:", err);
      });
      audioContextRef.current = null;
    }
    sourceNodeRef.current = null;
    gainNodeRef.current = null;
    analyserRef.current = null;
    setIsInitialized(false);
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    initializeAudioContext,
    setVolume,
    getFrequencyData,
    resume,
    cleanup,
    isInitialized,
    audioContext: audioContextRef.current,
  };
}
