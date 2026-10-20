/**
 * Spectrum analysis for the visualiser. Deliberately free of any WebGPU or
 * DOM dependency so the hot path can be imported without pulling the GPU
 * runtime into the initial bundle, and so it stays unit-testable.
 */

/** Number of frequency bars, fixed by the shader's `Spectrum` array length. */
export const BAR_COUNT = 64;

/**
 * Downsample an AnalyserNode's frequency bins into `out` (length BAR_COUNT).
 *
 * Uses a log-ish band mapping so high frequencies stay visible, and an
 * asymmetric envelope (fast attack, slow release) so the bars read as musical
 * rather than jittery. The band edges are pinned to the first and last bin so
 * no spectral content is dropped at either extreme.
 */
export function computeBars(
  analyser: AnalyserNode,
  out: Float32Array,
  smoothing = 0.72,
): Float32Array {
  const binCount = analyser.frequencyBinCount;
  const data = new Uint8Array(binCount);
  analyser.getByteFrequencyData(data);

  const count = Math.min(out.length, BAR_COUNT);

  for (let i = 0; i < count; i++) {
    const start = i === 0 ? 0 : Math.floor(((i + 1) / count) ** 1.6 * binCount);
    const end = i === count - 1 ? binCount : Math.floor(((i + 2) / count) ** 1.6 * binCount);

    let peak = 0;
    for (let b = start; b < end && b < binCount; b++) {
      if (data[b] > peak) peak = data[b];
    }

    const normalized = peak / 255;
    const previous = out[i];
    out[i] = normalized > previous ? normalized : previous + (normalized - previous) * smoothing;
  }

  for (let i = count; i < out.length; i++) {
    out[i] = 0;
  }

  return out;
}
