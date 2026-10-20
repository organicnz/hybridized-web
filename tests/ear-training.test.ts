import { describe, expect, it } from "bun:test";
import {
  CHORD_QUALITIES,
  INTERVALS,
  buildChordQuestion,
  buildIntervalQuestion,
  buildQuestion,
  createRng,
  describeQuestion,
  describeScore,
  isAnswerCorrect,
  midiToFreq,
  midiToName,
  summarise,
} from "@/lib/audio/ear-training";

describe("midiToFreq", () => {
  it("maps A4 to 440 Hz", () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 6);
  });

  it("maps middle C to ~261.63 Hz", () => {
    expect(midiToFreq(60)).toBeCloseTo(261.626, 3);
  });
});

describe("midiToName", () => {
  it("names the natural notes", () => {
    expect(midiToName(60)).toBe("C");
    expect(midiToName(69)).toBe("A");
  });

  it("wraps octaves", () => {
    expect(midiToName(72)).toBe("C");
  });

  it("handles notes below middle C", () => {
    expect(midiToName(48)).toBe("C");
  });
});

describe("createRng", () => {
  it("is deterministic for a given seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    const first = [a(), a(), a()];
    const second = [b(), b(), b()];
    expect(first).toEqual(second);
  });

  it("produces different streams for different seeds", () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(a()).not.toBe(b());
  });

  it("stays within [0, 1)", () => {
    const rng = createRng(7);
    for (let i = 0; i < 200; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("INTERVALS", () => {
  it("has no duplicate semitone counts", () => {
    const counts = INTERVALS.map((i) => i.semitones);
    expect(new Set(counts).size).toBe(counts.length);
  });

  it("is ordered by pitch distance", () => {
    for (let i = 1; i < INTERVALS.length; i++) {
      expect(INTERVALS[i].semitones).toBeGreaterThan(INTERVALS[i - 1].semitones);
    }
  });
});

describe("buildIntervalQuestion", () => {
  it("targets a pitch that matches the answer's semitone distance", () => {
    const rng = createRng(11);
    for (let i = 0; i < 200; i++) {
      const q = buildIntervalQuestion(rng);
      const distance = Math.abs(q.targetMidi - q.rootMidi);
      expect(distance).toBe(q.answer.semitones);
    }
  });

  it("respects the stated direction", () => {
    const rng = createRng(5);
    for (let i = 0; i < 200; i++) {
      const q = buildIntervalQuestion(rng);
      if (q.direction === "ascending") {
        expect(q.targetMidi).toBeGreaterThan(q.rootMidi);
      } else {
        expect(q.targetMidi).toBeLessThan(q.rootMidi);
      }
    }
  });

  it("keeps both notes inside a comfortable listening range", () => {
    const rng = createRng(99);
    for (let i = 0; i < 300; i++) {
      const q = buildIntervalQuestion(rng);
      expect(q.rootMidi).toBeGreaterThanOrEqual(48);
      expect(q.rootMidi).toBeLessThanOrEqual(72);
      expect(q.targetMidi).toBeGreaterThanOrEqual(36);
      expect(q.targetMidi).toBeLessThanOrEqual(72);
    }
  });

  it("reproduces the same question from the same seed", () => {
    const first = buildIntervalQuestion(createRng(3));
    const second = buildIntervalQuestion(createRng(3));
    expect(first).toEqual(second);
  });

  it("only ever answers with a known interval", () => {
    const rng = createRng(17);
    for (let i = 0; i < 200; i++) {
      const q = buildIntervalQuestion(rng);
      expect(INTERVALS).toContain(q.answer);
    }
  });
});

describe("CHORD_QUALITIES", () => {
  it("builds triads", () => {
    for (const quality of CHORD_QUALITIES) {
      expect(quality.intervals).toHaveLength(3);
    }
  });

  it("always starts at the root", () => {
    for (const quality of CHORD_QUALITIES) {
      expect(quality.intervals[0]).toBe(0);
    }
  });

  it("has unique ids and short names", () => {
    expect(new Set(CHORD_QUALITIES.map((q) => q.id)).size).toBe(CHORD_QUALITIES.length);
    expect(new Set(CHORD_QUALITIES.map((q) => q.short)).size).toBe(CHORD_QUALITIES.length);
  });

  it("keeps every interval within an octave", () => {
    for (const quality of CHORD_QUALITIES) {
      for (const semitones of quality.intervals) {
        expect(semitones).toBeGreaterThanOrEqual(0);
        expect(semitones).toBeLessThanOrEqual(12);
      }
    }
  });
});

describe("buildChordQuestion", () => {
  it("builds notes that match the answer's shape", () => {
    const rng = createRng(23);
    for (let i = 0; i < 200; i++) {
      const q = buildChordQuestion(rng);
      expect(q.notes).toHaveLength(3);
      expect(q.notes[0]).toBe(q.rootMidi);
      for (let n = 0; n < q.notes.length; n++) {
        expect(q.notes[n] - q.rootMidi).toBe(q.answer.intervals[n]);
      }
    }
  });

  it("keeps chords in a singable range", () => {
    const rng = createRng(31);
    for (let i = 0; i < 200; i++) {
      const q = buildChordQuestion(rng);
      expect(q.notes[0]).toBeGreaterThanOrEqual(48);
      expect(q.notes[2]).toBeLessThanOrEqual(76);
    }
  });
});

describe("buildQuestion", () => {
  it("dispatches to the requested mode", () => {
    expect(buildQuestion("interval", createRng(1)).kind).toBe("interval");
    expect(buildQuestion("chord", createRng(1)).kind).toBe("chord");
  });
});

describe("isAnswerCorrect", () => {
  it("accepts the correct interval short name", () => {
    const q = buildIntervalQuestion(createRng(4));
    expect(isAnswerCorrect(q, q.answer.short)).toBe(true);
    expect(isAnswerCorrect(q, "nope")).toBe(false);
  });

  it("accepts the correct chord short name", () => {
    const q = buildChordQuestion(createRng(4));
    expect(isAnswerCorrect(q, q.answer.short)).toBe(true);
    expect(isAnswerCorrect(q, "nope")).toBe(false);
  });
});

describe("describeQuestion", () => {
  it("names both interval notes", () => {
    const q = buildIntervalQuestion(createRng(8));
    expect(describeQuestion(q)).toBe(`${midiToName(q.rootMidi)} → ${midiToName(q.targetMidi)}`);
  });

  it("names the chord root and quality", () => {
    const q = buildChordQuestion(createRng(8));
    expect(describeQuestion(q)).toBe(`${midiToName(q.rootMidi)} ${q.answer.name}`);
  });
});

describe("summarise", () => {
  const question = buildIntervalQuestion(createRng(1));

  it("handles an empty run", () => {
    expect(summarise([])).toEqual({ correct: 0, total: 0, accuracy: 0, bestStreak: 0 });
  });

  it("counts correct answers and accuracy", () => {
    const summary = summarise([
      { question, chosen: "m3", correct: true },
      { question, chosen: "m3", correct: false },
      { question, chosen: "m3", correct: true },
      { question, chosen: "m3", correct: true },
    ]);
    expect(summary.correct).toBe(3);
    expect(summary.total).toBe(4);
    expect(summary.accuracy).toBeCloseTo(0.75, 6);
  });

  it("tracks the longest streak, not the final one", () => {
    const summary = summarise([
      { question, chosen: "m3", correct: true },
      { question, chosen: "m3", correct: true },
      { question, chosen: "m3", correct: true },
      { question, chosen: "m3", correct: false },
      { question, chosen: "m3", correct: false },
    ]);
    expect(summary.bestStreak).toBe(3);
  });

  it("resets the streak on a miss", () => {
    const summary = summarise([
      { question, chosen: "m3", correct: true },
      { question, chosen: "m3", correct: false },
      { question, chosen: "m3", correct: true },
    ]);
    expect(summary.bestStreak).toBe(1);
  });
});

describe("describeScore", () => {
  const at = (accuracy: number) => describeScore({ correct: 0, total: 1, accuracy, bestStreak: 0 });

  it("bands accuracy into skill levels", () => {
    expect(at(1)).toBe("Virtuoso");
    expect(at(0.8)).toBe("Advanced");
    expect(at(0.6)).toBe("Intermediate");
    expect(at(0.4)).toBe("Developing");
    expect(at(0.1)).toBe("Beginner");
  });

  it("handles a zero-score run", () => {
    expect(describeScore({ correct: 0, total: 0, accuracy: 0, bestStreak: 0 })).toBe("Beginner");
  });
});
