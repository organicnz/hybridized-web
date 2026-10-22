/**
 * Audio utility functions for optimal performance and quality
 */

type AudioWindow = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

function getAudioContextCtor(): typeof AudioContext | undefined {
  const audioWindow = window as AudioWindow;
  return audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
}

/**
 * Create an AudioContext, accounting for the legacy webkit prefix.
 * Returns null when the Web Audio API is unavailable.
 */
export function createAudioContext(options?: AudioContextOptions): AudioContext | null {
  const Ctor = getAudioContextCtor();
  if (!Ctor) return null;
  return new Ctor(options);
}

/**
 * Check if Web Audio API is supported
 */
export function isWebAudioSupported(): boolean {
  return getAudioContextCtor() !== undefined;
}

/**
 * Get optimal sample rate for the device
 * Most devices support 44.1kHz or 48kHz
 */
export function getOptimalSampleRate(): number {
  const Ctor = getAudioContextCtor();
  if (!Ctor) return 44100;

  const tempContext = new Ctor();
  const sampleRate = tempContext.sampleRate;
  // The context is only being measured. Closing it is tidying up, and a
  // browser that refuses to close it changes nothing.
  void tempContext.close().catch(() => {});

  return sampleRate;
}

/**
 * Convert decibels to linear gain
 */
export function dbToGain(db: number): number {
  return 10 ** (db / 20);
}

/**
 * Convert linear gain to decibels
 */
export function gainToDb(gain: number): number {
  return 20 * Math.log10(gain);
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Check if browser supports HRTF panning
 */
export function supportsHRTF(): boolean {
  if (!isWebAudioSupported()) return false;

  try {
    const Ctor = getAudioContextCtor();
    if (!Ctor) return false;
    const tempContext = new Ctor();
    const panner = tempContext.createPanner();
    const supported = "HRTF" in panner;
    void tempContext.close().catch(() => {});
    return supported;
  } catch {
    return false;
  }
}

/**
 * Format frequency for display (e.g., 1000 -> "1K")
 */
export function formatFrequency(freq: number): string {
  if (freq >= 1000) {
    return `${freq / 1000}K`;
  }
  return freq.toString();
}
