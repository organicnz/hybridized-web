import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
  clamp,
  createAudioContext,
  dbToGain,
  formatFrequency,
  gainToDb,
  getOptimalSampleRate,
  isWebAudioSupported,
  supportsHRTF,
} from "@/lib/audio-utils";

class MockPanner {
  panningModel = "";
  distanceModel = "";
  refDistance = 0;
  maxDistance = 0;
  rolloffFactor = 0;
  coneInnerAngle = 0;
  coneOuterAngle = 0;
  coneOuterGain = 0;
}

class MockAudioContext {
  state: AudioContextState = "running";
  sampleRate = 48000;
  currentTime = 0;
  destination = {};
  closed = false;

  createPanner() {
    return new MockPanner();
  }

  createMediaElementSource() {
    return { connect: () => {} };
  }

  resume() {
    this.state = "running";
    return Promise.resolve();
  }

  close() {
    this.closed = true;
    this.state = "closed";
    return Promise.resolve();
  }
}

const originalWindow = globalThis.window;

function setWindow(value: unknown) {
  globalThis.window = value as Window & typeof globalThis;
}

beforeEach(() => {
  setWindow({ AudioContext: MockAudioContext });
});

afterEach(() => {
  setWindow(originalWindow);
});

describe("dbToGain", () => {
  it("returns 1 for 0 dB", () => {
    expect(dbToGain(0)).toBe(1);
  });

  it("returns 10 for 20 dB", () => {
    expect(dbToGain(20)).toBe(10);
  });

  it("returns 0.1 for -20 dB", () => {
    expect(dbToGain(-20)).toBeCloseTo(0.1, 5);
  });
});

describe("gainToDb", () => {
  it("returns 0 for unity gain", () => {
    expect(gainToDb(1)).toBe(0);
  });

  it("returns 20 for gain of 10", () => {
    expect(gainToDb(10)).toBeCloseTo(20, 5);
  });

  it("is the inverse of dbToGain", () => {
    expect(gainToDb(dbToGain(-6))).toBeCloseTo(-6, 5);
  });
});

describe("clamp", () => {
  it("returns the value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps to the minimum", () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });

  it("clamps to the maximum", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe("formatFrequency", () => {
  it("formats frequencies below 1000 as-is", () => {
    expect(formatFrequency(60)).toBe("60");
    expect(formatFrequency(500)).toBe("500");
  });

  it("formats frequencies at or above 1000 with a K suffix", () => {
    expect(formatFrequency(1000)).toBe("1K");
    expect(formatFrequency(16000)).toBe("16K");
  });
});

describe("isWebAudioSupported", () => {
  it("returns true when AudioContext exists", () => {
    expect(isWebAudioSupported()).toBe(true);
  });

  it("returns false when AudioContext is missing", () => {
    setWindow({});
    expect(isWebAudioSupported()).toBe(false);
  });

  it("falls back to the webkit prefix", () => {
    setWindow({ webkitAudioContext: MockAudioContext });
    expect(isWebAudioSupported()).toBe(true);
  });
});

describe("createAudioContext", () => {
  it("creates a context with options", () => {
    const ctx = createAudioContext({ latencyHint: "playback", sampleRate: 44100 });
    expect(ctx).toBeInstanceOf(MockAudioContext);
  });

  it("returns null when unsupported", () => {
    setWindow({});
    expect(createAudioContext()).toBeNull();
  });
});

describe("getOptimalSampleRate", () => {
  it("returns the context sample rate", () => {
    expect(getOptimalSampleRate()).toBe(48000);
  });

  it("falls back to 44100 when unsupported", () => {
    setWindow({});
    expect(getOptimalSampleRate()).toBe(44100);
  });
});

describe("supportsHRTF", () => {
  it("returns false when unsupported", () => {
    setWindow({});
    expect(supportsHRTF()).toBe(false);
  });

  it("returns false when the panner lacks HRTF", () => {
    expect(supportsHRTF()).toBe(false);
  });

  it("returns true when the panner supports HRTF", () => {
    setWindow({
      AudioContext: class extends MockAudioContext {
        override createPanner() {
          return { ...new MockPanner(), HRTF: "HRTF" };
        }
      },
    });
    expect(supportsHRTF()).toBe(true);
  });
});
