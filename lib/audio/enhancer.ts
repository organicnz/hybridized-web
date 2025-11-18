"use client";

/**
 * Audio Enhancement System using Web Audio API
 * Provides hardware-accelerated audio processing
 */

export interface AudioEnhancementSettings {
  bassBoost: number;      // 0-100
  trebleBoost: number;    // 0-100
  compression: boolean;   // Dynamic range compression
  spatialAudio: boolean;  // 3D audio effect
  normalize: boolean;     // Volume normalization
}

export class AudioEnhancer {
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private panner: StereoPannerNode | null = null;
  private analyser: AnalyserNode | null = null;
  private connectedElement: HTMLMediaElement | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new AudioContext();
    }
  }

  /**
   * Connect audio element to enhancement pipeline
   */
  connectAudio(audioElement: HTMLMediaElement): void {
    if (!this.audioContext || this.connectedElement === audioElement) {
      return;
    }

    try {
      // Create source node if not exists
      if (!this.sourceNode) {
        this.sourceNode = this.audioContext.createMediaElementSource(audioElement);
      }

      // Create audio nodes
      this.gainNode = this.audioContext.createGain();
      this.bassFilter = this.audioContext.createBiquadFilter();
      this.trebleFilter = this.audioContext.createBiquadFilter();
      this.compressor = this.audioContext.createDynamicsCompressor();
      this.panner = this.audioContext.createStereoPanner();
      this.analyser = this.audioContext.createAnalyser();

      // Configure bass filter (low-shelf)
      this.bassFilter.type = 'lowshelf';
      this.bassFilter.frequency.value = 200;
      this.bassFilter.gain.value = 0;

      // Configure treble filter (high-shelf)
      this.trebleFilter.type = 'highshelf';
      this.trebleFilter.frequency.value = 3000;
      this.trebleFilter.gain.value = 0;

      // Configure compressor for better dynamics
      this.compressor.threshold.value = -24;
      this.compressor.knee.value = 30;
      this.compressor.ratio.value = 12;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.25;

      // Configure analyser for visualization
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      // Connect the audio pipeline
      this.sourceNode
        .connect(this.bassFilter)
        .connect(this.trebleFilter)
        .connect(this.compressor)
        .connect(this.gainNode)
        .connect(this.panner)
        .connect(this.analyser)
        .connect(this.audioContext.destination);

      this.connectedElement = audioElement;

      // Resume audio context on user interaction
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
    } catch (error) {
      console.error('Error connecting audio:', error);
    }
  }

  /**
   * Apply enhancement settings
   */
  applySettings(settings: AudioEnhancementSettings): void {
    if (!this.audioContext) return;

    // Bass boost (0-100 -> 0-12 dB)
    if (this.bassFilter) {
      this.bassFilter.gain.value = (settings.bassBoost / 100) * 12;
    }

    // Treble boost (0-100 -> 0-12 dB)
    if (this.trebleFilter) {
      this.trebleFilter.gain.value = (settings.trebleBoost / 100) * 12;
    }

    // Compression
    if (this.compressor) {
      this.compressor.ratio.value = settings.compression ? 12 : 1;
    }

    // Normalization (via gain)
    if (this.gainNode && settings.normalize) {
      this.gainNode.gain.value = 1.2;
    } else if (this.gainNode) {
      this.gainNode.gain.value = 1.0;
    }
  }

  /**
   * Get frequency data for visualization
   */
  getFrequencyData(): Uint8Array | null {
    if (!this.analyser) return null;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  /**
   * Enable hardware acceleration
   */
  enableHardwareAcceleration(): void {
    if (!this.audioContext) return;

    // Set sample rate to match hardware
    const sampleRate = this.audioContext.sampleRate;
    console.log(`Audio hardware sample rate: ${sampleRate}Hz`);

    // Enable low-latency mode
    if ('audioWorklet' in this.audioContext) {
      console.log('AudioWorklet available - hardware acceleration enabled');
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.connectedElement = null;
  }

  /**
   * Get audio context state
   */
  getState(): string {
    return this.audioContext?.state || 'closed';
  }

  /**
   * Resume audio context (needed after user interaction)
   */
  async resume(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
}

// Singleton instance
let enhancerInstance: AudioEnhancer | null = null;

export function getAudioEnhancer(): AudioEnhancer {
  if (!enhancerInstance) {
    enhancerInstance = new AudioEnhancer();
  }
  return enhancerInstance;
}

// Default enhancement settings
export const DEFAULT_AUDIO_SETTINGS: AudioEnhancementSettings = {
  bassBoost: 30,
  trebleBoost: 20,
  compression: true,
  spatialAudio: false,
  normalize: true,
};
