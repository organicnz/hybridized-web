/**
 * Audio utility functions for optimal performance and quality
 */

/**
 * Check if Web Audio API is supported
 */
export function isWebAudioSupported(): boolean {
  return !!(window.AudioContext || (window as any).webkitAudioContext);
}

/**
 * Get optimal sample rate for the device
 * Most devices support 44.1kHz or 48kHz
 */
export function getOptimalSampleRate(): number {
  if (!isWebAudioSupported()) return 44100;

  const tempContext = new (window.AudioContext ||
    (window as any).webkitAudioContext)();
  const sampleRate = tempContext.sampleRate;
  tempContext.close();

  return sampleRate;
}

/**
 * Convert decibels to linear gain
 */
export function dbToGain(db: number): number {
  return Math.pow(10, db / 20);
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
    const tempContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const panner = tempContext.createPanner();
    const supported = "HRTF" in panner;
    tempContext.close();
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
