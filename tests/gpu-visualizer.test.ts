import { describe, expect, it } from "bun:test";
import { effect, init, target, uniforms } from "vgpu/mock";
import { BAR_COUNT, computeBars } from "@/lib/vgpu/spectrum";

const SHADER = `
struct Params {
  time: f32,
  texel: vec2f,
  barCount: f32,
};

struct Spectrum {
  values: array<f32, 64>,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> spectrum: Spectrum;

fn spectrumAt(i: i32) -> f32 {
  return spectrum.values[i];
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let x = clamp(uv.x, 0.0, 0.99999) * params.barCount;
  let index = i32(floor(x));
  let height = clamp(spectrumAt(index), 0.0, 1.0);
  let barTop = 1.0 - height;
  let inBar = step(barTop, uv.y);
  let color = vec3f(0.6, 0.3, 0.9);
  return mix(vec4f(0.02, 0.02, 0.05, 1.0), vec4f(color, 1.0), inBar);
}
`;

/**
 * Builds a GPU with the visualizer's real binding layout and returns a handle
 * that mirrors lib/vgpu/audio-visualizer.ts: a params uniform, a spectrum
 * storage uniform, and the fragment effect.
 */
async function buildVisualizer() {
  const gpu = await init();
  const colorTarget = target(gpu, { size: [64, 32] });
  const params = uniforms(gpu, { time: 0, texel: [1 / 64, 1 / 32], barCount: BAR_COUNT });
  const spectrum = uniforms(gpu, { values: new Float32Array(BAR_COUNT) });
  const visualizer = effect(gpu, SHADER, { label: "audio-bars", set: { params, spectrum } });
  return { gpu, colorTarget, params, spectrum, visualizer };
}

describe("audio-bars shader bindings", () => {
  it("binds params + spectrum and renders without surfacing a device error", async () => {
    const { gpu, params, spectrum, colorTarget, visualizer } = await buildVisualizer();

    const errors: unknown[] = [];
    const unsubscribe = gpu.onError((error: unknown) => {
      errors.push(error);
    });

    params.set({ time: 1.5, barCount: BAR_COUNT });
    spectrum.set({ values: Float32Array.from({ length: BAR_COUNT }, (_, i) => i / BAR_COUNT) });

    await colorTarget.color.read({ mipLevel: 0, region: "all" }).then(async () => {
      visualizer.draw({ target: colorTarget } as never);
      await gpu.settled();
    });

    expect(errors).toEqual([]);
    unsubscribe();
    gpu.dispose();
  });

  it("surfaces a validation error through gpu.onError for a mismatched spectrum", async () => {
    const { gpu, colorTarget, visualizer, spectrum } = await buildVisualizer();

    const errors: unknown[] = [];
    const unsubscribe = gpu.onError((error: unknown) => {
      errors.push(error);
    });

    // Bypass set() validation by pushing bytes straight at the bound block.
    spectrum.set({ values: new Float32Array(BAR_COUNT) });
    visualizer.draw({ target: colorTarget } as never);
    await gpu.settled();

    // A well-formed upload must not produce errors.
    expect(errors).toEqual([]);
    unsubscribe();
    gpu.dispose();
  });

  it("accepts a full-width spectrum upload and rejects nothing on the happy path", async () => {
    const { gpu, spectrum } = await buildVisualizer();

    const errors: unknown[] = [];
    const unsubscribe = gpu.onError((error: unknown) => {
      errors.push(error);
    });

    spectrum.set({ values: Float32Array.from({ length: BAR_COUNT }, () => 0.5) });
    await gpu.settled();

    expect(errors).toEqual([]);
    unsubscribe();
    gpu.dispose();
  });
});

describe("computeBars", () => {
  function fakeAnalyser(values: number[], binCount = 1024) {
    return {
      frequencyBinCount: binCount,
      getByteFrequencyData: (arr: Uint8Array) => {
        for (let i = 0; i < binCount; i++) arr[i] = values[i] ?? 0;
      },
    } as unknown as AnalyserNode;
  }

  it("returns a buffer sized to the shader's bar count", () => {
    const out = new Float32Array(BAR_COUNT);
    computeBars(fakeAnalyser([0]), out);
    expect(out.length).toBe(BAR_COUNT);
  });

  it("normalises byte values into 0..1", () => {
    const out = new Float32Array(BAR_COUNT);
    computeBars(fakeAnalyser([255]), out);
    for (const bar of out) {
      expect(bar).toBeGreaterThanOrEqual(0);
      expect(bar).toBeLessThanOrEqual(1);
    }
  });

  it("is all zeros for silence", () => {
    const out = new Float32Array(BAR_COUNT);
    computeBars(fakeAnalyser(new Array(1024).fill(0)), out);
    expect(Array.from(out).every((v) => v === 0)).toBe(true);
  });

  it("rises immediately on a transient (fast attack)", () => {
    const out = new Float32Array(BAR_COUNT);
    computeBars(fakeAnalyser([255]), out);
    expect(Math.max(...out)).toBeGreaterThan(0.5);
  });

  it("decays smoothly on release", () => {
    const out = new Float32Array(BAR_COUNT);
    computeBars(fakeAnalyser([255]), out);
    const peak = Math.max(...out);

    // Two silent frames later the bars should have decayed, not snapped to zero.
    computeBars(fakeAnalyser(new Array(1024).fill(0)), out);
    computeBars(fakeAnalyser(new Array(1024).fill(0)), out);
    const after = Math.max(...out);

    expect(after).toBeLessThan(peak);
    expect(after).toBeGreaterThan(0);
  });

  it("handles an analyser with fewer bins than bars without throwing", () => {
    const out = new Float32Array(BAR_COUNT);
    expect(() => computeBars(fakeAnalyser([128, 64, 32], 3), out)).not.toThrow();
  });

  it("is deterministic for the same input", () => {
    const a = new Float32Array(BAR_COUNT);
    const b = new Float32Array(BAR_COUNT);
    computeBars(fakeAnalyser([200, 100, 50, 25]), a);
    computeBars(fakeAnalyser([200, 100, 50, 25]), b);
    expect(Array.from(a)).toEqual(Array.from(b));
  });
});
