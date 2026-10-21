"use client";

import { createAudioContext } from "@/lib/audio-utils";
import { useCallback, useEffect, useRef, useState } from "react";

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
      // Already initialised — reuse the context and the graph.
      //
      // An <audio> element can be connected to a MediaElementAudioSourceNode
      // only once, for the life of the page: the Web Audio API has no way to
      // unbind it. React's Strict Mode runs a mount effect twice, so a second
      // call has to reuse the graph rather than build a new one.
      if (audioContextRef.current) {
        setIsInitialized(true);
        return audioContextRef.current;
      }

      // Create AudioContext with hardware acceleration hints
      const contextOptions: AudioContextOptions = {
        latencyHint: config.latencyHint || "playback",
        sampleRate: config.sampleRate || 48000, // Higher sample rate for better quality
      };

      const audioContext = createAudioContext(contextOptions);
      if (!audioContext) throw new Error("Web Audio API is not supported");
      audioContextRef.current = audioContext;

      // Create audio nodes for processing
      let source: MediaElementAudioSourceNode;
      try {
        source = audioContext.createMediaElementSource(audioElement);
      } catch {
        // The element is already bound to a source node — the graph cannot be
        // attached to it, but the page must not break over it.
        setIsInitialized(false);
        return audioContext;
      }
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
      gainNodeRef.current.gain.setValueAtTime(clampedVolume, audioContextRef.current.currentTime);
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
    // The graph is deliberately kept. An <audio> element stays bound to the
    // source node it was connected to, for the life of the page, so closing
    // the context here would leave the element bound to a dead context — and
    // React's Strict Mode, which runs a mount effect twice, would then build
    // a second graph for the same element and throw "HTMLMediaElement
    // already connected previously to a different MediaElementSourceNode".
    //
    // The browser releases the context when the page goes away.
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
    /** Live ref to the AnalyserNode driving the graph, for visualiser consumers. */
    analyserRef,
    resume,
    cleanup,
    isInitialized,
    audioContext: audioContextRef.current,
  };
}
