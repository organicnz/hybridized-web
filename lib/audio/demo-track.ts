const TAU = Math.PI * 2;

export type Waveform = "sine" | "triangle" | "sawtooth";

export interface DemoTrackOptions {
  sampleRate?: number;
  bpm?: number;
}

interface Voice {
  freq: number;
  startSeconds: number;
  durationSeconds: number;
  gain: number;
  waveform: Waveform;
  attack: number;
  release: number;
}

const PROGRESSION: { bass: number; triad: number[] }[] = [
  { bass: 45, triad: [57, 60, 64] }, // Am
  { bass: 41, triad: [53, 57, 60] }, // F
  { bass: 48, triad: [60, 64, 67] }, // C
  { bass: 43, triad: [55, 59, 62] }, // G
];

export function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

function osc(waveform: Waveform, phase: number): number {
  const cycle = phase % 1;
  switch (waveform) {
    case "triangle":
      return 4 * Math.abs(cycle - 0.5) - 1;
    case "sawtooth":
      return 2 * cycle - 1;
    default:
      return Math.sin(cycle * TAU);
  }
}

function envelope(t: number, duration: number, attack: number, release: number): number {
  if (t < 0 || t > duration) return 0;
  if (t < attack) return t / attack;
  if (t > duration - release) return Math.max(0, (duration - t) / release);
  return 1;
}

/**
 * Render a seamless, deterministic music loop to mono float samples.
 * Used as the audio source for the engine demo so the page needs no
 * external asset and always has signal to drive the analyser.
 */
export function renderDemoLoop(options: DemoTrackOptions = {}): Float32Array {
  const { sampleRate = 44100, bpm = 100 } = options;

  const beatSeconds = 60 / bpm;
  const chordSeconds = beatSeconds * 2;
  const totalSeconds = chordSeconds * PROGRESSION.length;
  const total = Math.floor(sampleRate * totalSeconds);
  const samples = new Float32Array(total);

  const voices: Voice[] = [];

  for (let chordIndex = 0; chordIndex < PROGRESSION.length; chordIndex++) {
    const chord = PROGRESSION[chordIndex];
    const chordStart = chordIndex * chordSeconds;

    voices.push({
      freq: midiToFreq(chord.bass),
      startSeconds: chordStart,
      durationSeconds: chordSeconds,
      gain: 0.34,
      waveform: "sine",
      attack: 0.02,
      release: 0.28,
    });

    for (const midi of chord.triad) {
      voices.push({
        freq: midiToFreq(midi),
        startSeconds: chordStart,
        durationSeconds: chordSeconds * 0.98,
        gain: 0.1,
        waveform: "triangle",
        attack: 0.35,
        release: 0.4,
      });
    }

    const arpSteps = 8;
    for (let step = 0; step < arpSteps; step++) {
      const up = step % 4;
      const note = chord.triad[up < 3 ? up : 2];
      const octave = up < 3 ? 12 : 0;

      voices.push({
        freq: midiToFreq(note + octave),
        startSeconds: chordStart + (step * chordSeconds) / arpSteps,
        durationSeconds: chordSeconds / arpSteps,
        gain: 0.15,
        waveform: "triangle",
        attack: 0.006,
        release: 0.08,
      });
    }
  }

  for (let i = 0; i < total; i++) {
    const t = i / sampleRate;
    let mix = 0;

    for (const voice of voices) {
      const local = t - voice.startSeconds;
      const env = envelope(local, voice.durationSeconds, voice.attack, voice.release);
      if (env === 0) continue;
      mix += osc(voice.waveform, voice.freq * local) * env * voice.gain;
    }

    samples[i] = Math.max(-1, Math.min(1, mix));
  }

  applyEdgeFade(samples, sampleRate, 0.01);

  return samples;
}

/**
 * Fade the very first and last few milliseconds to zero. The chord envelopes
 * already carry the loop across the boundary; this only removes the residual
 * discontinuity so the buffer does not click when it wraps.
 */
function applyEdgeFade(samples: Float32Array, sampleRate: number, seconds: number): void {
  const fade = Math.min(Math.floor(sampleRate * seconds), Math.floor(samples.length / 4));
  if (fade <= 0) return;

  for (let i = 0; i < fade; i++) {
    const gain = i / fade;
    samples[i] *= gain;
    samples[samples.length - 1 - i] *= gain;
  }
}

/** Encode mono float samples as a 16-bit PCM WAV file. */
export function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeText = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  writeText(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * bytesPerSample, Math.round(clamped * 32767), true);
  }

  return buffer;
}

/** Build an object URL for the synthesised loop. Browser only. */
export function createDemoTrackUrl(options: DemoTrackOptions = {}): string {
  const sampleRate = options.sampleRate ?? 44100;
  const samples = renderDemoLoop({ ...options, sampleRate });
  const wav = encodeWav(samples, sampleRate);
  return URL.createObjectURL(new Blob([wav], { type: "audio/wav" }));
}
