import { describe, expect, it } from "bun:test";
import { createDemoTrackUrl, encodeWav, midiToFreq, renderDemoLoop } from "@/lib/audio/demo-track";

const SAMPLE_RATE = 8000;

describe("midiToFreq", () => {
  it("maps A4 (MIDI 69) to 440 Hz", () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 6);
  });

  it("maps an octave to a doubling of frequency", () => {
    expect(midiToFreq(81)).toBeCloseTo(880, 6);
    expect(midiToFreq(57)).toBeCloseTo(220, 6);
  });

  it("is monotonically increasing", () => {
    for (let midi = 36; midi < 84; midi++) {
      expect(midiToFreq(midi + 1)).toBeGreaterThan(midiToFreq(midi));
    }
  });
});

describe("renderDemoLoop", () => {
  it("renders the requested number of samples", () => {
    const samples = renderDemoLoop({ sampleRate: SAMPLE_RATE, bpm: 120 });
    expect(samples.length).toBeGreaterThan(0);
    expect(samples.length % 1).toBe(0);
  });

  it("produces finite samples within [-1, 1]", () => {
    const samples = renderDemoLoop({ sampleRate: SAMPLE_RATE, bpm: 140 });
    for (const sample of samples) {
      expect(Number.isFinite(sample)).toBe(true);
      expect(sample).toBeGreaterThanOrEqual(-1);
      expect(sample).toBeLessThanOrEqual(1);
    }
  });

  it("is deterministic for identical options", () => {
    const a = renderDemoLoop({ sampleRate: SAMPLE_RATE, bpm: 110 });
    const b = renderDemoLoop({ sampleRate: SAMPLE_RATE, bpm: 110 });
    expect(Array.from(a)).toEqual(Array.from(b));
  });

  it("scales duration with tempo", () => {
    const slow = renderDemoLoop({ sampleRate: SAMPLE_RATE, bpm: 60 });
    const fast = renderDemoLoop({ sampleRate: SAMPLE_RATE, bpm: 240 });
    expect(slow.length).toBeGreaterThan(fast.length);
  });

  it("actually produces audio signal rather than silence", () => {
    const samples = renderDemoLoop({ sampleRate: SAMPLE_RATE, bpm: 110 });
    let peak = 0;
    let energy = 0;
    for (const sample of samples) {
      peak = Math.max(peak, Math.abs(sample));
      energy += sample * sample;
    }
    expect(peak).toBeGreaterThan(0.1);
    expect(Math.sqrt(energy / samples.length)).toBeGreaterThan(0.01);
  });

  it("loops seamlessly: the first and last samples match", () => {
    const samples = renderDemoLoop({ sampleRate: SAMPLE_RATE, bpm: 100 });
    const first = samples[0];
    const last = samples[samples.length - 1];
    expect(Math.abs(first - last)).toBeLessThan(0.2);
  });

  it("starts and ends near zero to avoid a click on loop", () => {
    const samples = renderDemoLoop({ sampleRate: SAMPLE_RATE, bpm: 100 });
    expect(Math.abs(samples[0])).toBeLessThan(0.2);
    expect(Math.abs(samples[samples.length - 1])).toBeLessThan(0.2);
  });

  it("contains a dominant low-frequency component", () => {
    const samples = renderDemoLoop({ sampleRate: SAMPLE_RATE, bpm: 100 });

    // Goertzel-style energy probe at ~55 Hz (A1) vs ~5 kHz.
    const probe = (freq: number) => {
      const coeff = 2 * Math.cos((2 * Math.PI * freq) / SAMPLE_RATE);
      let s0 = 0;
      let s1 = 0;
      let s2 = 0;
      for (let i = 0; i < samples.length; i++) {
        s0 = samples[i] + coeff * s1 - s2;
        s2 = s1;
        s1 = s0;
      }
      return Math.sqrt(s1 * s1 + s2 * s2 - coeff * s1 * s2) / samples.length;
    };

    expect(probe(55)).toBeGreaterThan(probe(5000));
  });
});

describe("encodeWav", () => {
  function readText(view: DataView, offset: number, length: number) {
    let out = "";
    for (let i = 0; i < length; i++) out += String.fromCharCode(view.getUint8(offset + i));
    return out;
  }

  it("writes a valid RIFF/WAVE header", () => {
    const samples = new Float32Array(100);
    const buffer = encodeWav(samples, SAMPLE_RATE);
    const view = new DataView(buffer);

    expect(readText(view, 0, 4)).toBe("RIFF");
    expect(readText(view, 8, 4)).toBe("WAVE");
    expect(readText(view, 12, 4)).toBe("fmt ");
    expect(readText(view, 36, 4)).toBe("data");
  });

  it("declares 16-bit mono PCM at the requested sample rate", () => {
    const samples = new Float32Array(64);
    const view = new DataView(encodeWav(samples, 44100));

    expect(view.getUint16(20, true)).toBe(1); // PCM
    expect(view.getUint16(22, true)).toBe(1); // mono
    expect(view.getUint32(24, true)).toBe(44100);
    expect(view.getUint16(34, true)).toBe(16); // bit depth
  });

  it("sizes the data chunk to 2 bytes per sample", () => {
    const samples = new Float32Array(128);
    const buffer = encodeWav(samples, SAMPLE_RATE);
    const view = new DataView(buffer);

    expect(view.getUint32(40, true)).toBe(128 * 2);
    expect(buffer.byteLength).toBe(44 + 128 * 2);
  });

  it("keeps the RIFF size field consistent with the payload", () => {
    const samples = new Float32Array(50);
    const buffer = encodeWav(samples, SAMPLE_RATE);
    const view = new DataView(buffer);
    expect(view.getUint32(4, true)).toBe(buffer.byteLength - 8);
  });

  it("maps full-scale input to 16-bit extremes", () => {
    const samples = new Float32Array([1, -1, 0]);
    const view = new DataView(encodeWav(samples, SAMPLE_RATE));

    expect(view.getInt16(44, true)).toBe(32767);
    expect(view.getInt16(46, true)).toBe(-32767);
    expect(view.getInt16(48, true)).toBe(0);
  });

  it("clamps out-of-range samples instead of wrapping", () => {
    const samples = new Float32Array([4, -4]);
    const view = new DataView(encodeWav(samples, SAMPLE_RATE));

    expect(view.getInt16(44, true)).toBe(32767);
    expect(view.getInt16(46, true)).toBe(-32767);
  });
});

describe("createDemoTrackUrl", () => {
  it("is an object URL for a WAV", async () => {
    const url = createDemoTrackUrl({ sampleRate: 8000, bpm: 120 });

    expect(url.startsWith("blob:")).toBe(true);

    const body = new Uint8Array(await (await fetch(url)).arrayBuffer());
    const header = new TextDecoder().decode(body.subarray(0, 12));

    expect(header.startsWith("RIFF")).toBe(true);
    expect(header).toContain("WAVE");
  });

  it("is a different track for a different tempo", () => {
    const slow = createDemoTrackUrl({ sampleRate: 8000, bpm: 100 });
    const fast = createDemoTrackUrl({ sampleRate: 8000, bpm: 120 });

    expect(slow).not.toBe(fast);
  });
});
