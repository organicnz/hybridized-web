"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface AudioWorkletConfig {
  enableSpatialAudio?: boolean;
  enableDynamicCompression?: boolean;
  enableEqualizer?: boolean;
}

export function useAudioWorklet(config: AudioWorkletConfig = {}) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const pannerRef = useRef<PannerNode | null>(null);
  const equalizerRef = useRef<BiquadFilterNode[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [isReady, setIsReady] = useState(false);

  const initializeAdvancedAudio = useCallback(
    (audioElement: HTMLAudioElement) => {
      if (audioContextRef.current) return audioContextRef.current;

      // Create high-performance audio context with optimal settings
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)({
        latencyHint: "playback",
        sampleRate: 48000,
      });

      audioContextRef.current = audioContext;
      const source = audioContext.createMediaElementSource(audioElement);
      sourceNodeRef.current = source;

      let currentNode: AudioNode = source;

      // Dynamic Range Compression for consistent volume and loudness
      if (config.enableDynamicCompression) {
        const compressor = audioContext.createDynamicsCompressor();
        // Industry-standard mastering settings
        compressor.threshold.setValueAtTime(-24, audioContext.currentTime);
        compressor.knee.setValueAtTime(30, audioContext.currentTime);
        compressor.ratio.setValueAtTime(12, audioContext.currentTime);
        compressor.attack.setValueAtTime(0.003, audioContext.currentTime);
        compressor.release.setValueAtTime(0.25, audioContext.currentTime);
        currentNode.connect(compressor);
        currentNode = compressor;
        compressorRef.current = compressor;
      }

      // 10-band Parametric Equalizer with optimal Q values
      if (config.enableEqualizer) {
        const frequencies = [
          32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000,
        ];
        const filters: BiquadFilterNode[] = [];

        frequencies.forEach((freq, index) => {
          const filter = audioContext.createBiquadFilter();

          // Use shelf filters for extremes, peaking for mid-range
          if (index === 0) {
            filter.type = "lowshelf";
          } else if (index === frequencies.length - 1) {
            filter.type = "highshelf";
          } else {
            filter.type = "peaking";
          }

          filter.frequency.setValueAtTime(freq, audioContext.currentTime);
          // Optimal Q value for musical EQ (not too narrow, not too wide)
          filter.Q.setValueAtTime(1.0, audioContext.currentTime);
          filter.gain.setValueAtTime(0, audioContext.currentTime);

          currentNode.connect(filter);
          currentNode = filter;
          filters.push(filter);
        });

        equalizerRef.current = filters;
      }

      // 3D Spatial Audio with HRTF (Head-Related Transfer Function)
      if (config.enableSpatialAudio) {
        const panner = audioContext.createPanner();

        // HRTF provides the most realistic 3D audio positioning
        panner.panningModel = "HRTF";
        panner.distanceModel = "inverse";
        panner.refDistance = 1;
        panner.maxDistance = 10000;
        panner.rolloffFactor = 1;

        // Omnidirectional sound source
        panner.coneInnerAngle = 360;
        panner.coneOuterAngle = 0;
        panner.coneOuterGain = 0;

        // Set listener position (user's head)
        if (audioContext.listener.positionX) {
          audioContext.listener.positionX.setValueAtTime(
            0,
            audioContext.currentTime,
          );
          audioContext.listener.positionY.setValueAtTime(
            0,
            audioContext.currentTime,
          );
          audioContext.listener.positionZ.setValueAtTime(
            0,
            audioContext.currentTime,
          );
        }

        currentNode.connect(panner);
        currentNode = panner;
        pannerRef.current = panner;
      }

      // Add analyser node for visualization
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      currentNode.connect(analyser);
      analyserRef.current = analyser;

      // Connect to destination
      analyser.connect(audioContext.destination);
      setIsReady(true);

      return audioContext;
    },
    [config],
  );

  const setEQBand = useCallback((bandIndex: number, gain: number) => {
    if (equalizerRef.current[bandIndex] && audioContextRef.current) {
      const clampedGain = Math.max(-12, Math.min(12, gain));
      // Use setValueAtTime for smooth, glitch-free parameter changes
      equalizerRef.current[bandIndex].gain.setValueAtTime(
        clampedGain,
        audioContextRef.current.currentTime,
      );
    }
  }, []);

  const setSpatialPosition = useCallback((x: number, y: number, z: number) => {
    if (pannerRef.current && audioContextRef.current) {
      const now = audioContextRef.current.currentTime;
      // Smooth position transitions to avoid audio artifacts
      if (pannerRef.current.positionX) {
        pannerRef.current.positionX.setValueAtTime(x, now);
        pannerRef.current.positionY.setValueAtTime(y, now);
        pannerRef.current.positionZ.setValueAtTime(z, now);
      } else {
        // Fallback for older browsers
        pannerRef.current.setPosition(x, y, z);
      }
    }
  }, []);

  const setCompression = useCallback((threshold: number, ratio: number) => {
    if (compressorRef.current && audioContextRef.current) {
      const now = audioContextRef.current.currentTime;
      compressorRef.current.threshold.setValueAtTime(threshold, now);
      compressorRef.current.ratio.setValueAtTime(ratio, now);
    }
  }, []);

  const resume = useCallback(async () => {
    if (audioContextRef.current?.state === "suspended") {
      await audioContextRef.current.resume();
    }
  }, []);

  const getAnalyser = useCallback(() => {
    if (!audioContextRef.current) return null;

    // Create analyser if it doesn't exist
    if (!analyserRef.current) {
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
    }

    return analyserRef.current;
  }, []);

  const cleanup = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch((err) => {
        console.warn("Error closing audio context:", err);
      });
    }
    audioContextRef.current = null;
    sourceNodeRef.current = null;
    compressorRef.current = null;
    pannerRef.current = null;
    equalizerRef.current = [];
    analyserRef.current = null;
    setIsReady(false);
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    initializeAdvancedAudio,
    setEQBand,
    setSpatialPosition,
    setCompression,
    getAnalyser,
    resume,
    cleanup,
    isReady,
    audioContext: audioContextRef.current,
    analyser: analyserRef.current,
    hasEqualizer: config.enableEqualizer,
    hasSpatialAudio: config.enableSpatialAudio,
    hasCompression: config.enableDynamicCompression,
  };
}
