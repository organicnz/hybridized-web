/**
 * Ear-training question generation and scoring.
 *
 * Pure music theory and arithmetic — no Web Audio, no DOM — so the rules are
 * unit-testable and the synthesised playback layer can evolve independently.
 */

export interface Interval {
  semitones: number;
  name: string;
  short: string;
}

/** Eight intervals spanning the useful range for melodic ear training. */
export const INTERVALS: readonly Interval[] = [
  { semitones: 1, name: "Minor 2nd", short: "m2" },
  { semitones: 2, name: "Major 2nd", short: "M2" },
  { semitones: 3, name: "Minor 3rd", short: "m3" },
  { semitones: 4, name: "Major 3rd", short: "M3" },
  { semitones: 5, name: "Perfect 4th", short: "P4" },
  { semitones: 6, name: "Tritone", short: "TT" },
  { semitones: 7, name: "Perfect 5th", short: "P5" },
  { semitones: 12, name: "Octave", short: "P8" },
];

export type ChordQualityId = "major" | "minor" | "diminished" | "augmented" | "sus2" | "sus4";

export interface ChordQuality {
  id: ChordQualityId;
  name: string;
  short: string;
  /** Semitone offsets from the root, low to high. */
  intervals: readonly number[];
}

export const CHORD_QUALITIES: readonly ChordQuality[] = [
  { id: "major", name: "Major", short: "maj", intervals: [0, 4, 7] },
  { id: "minor", name: "Minor", short: "min", intervals: [0, 3, 7] },
  { id: "diminished", name: "Diminished", short: "dim", intervals: [0, 3, 6] },
  { id: "augmented", name: "Augmented", short: "aug", intervals: [0, 4, 8] },
  { id: "sus2", name: "Suspended 2nd", short: "sus2", intervals: [0, 2, 7] },
  { id: "sus4", name: "Suspended 4th", short: "sus4", intervals: [0, 5, 7] },
];

export type Direction = "ascending" | "descending";

export interface IntervalQuestion {
  kind: "interval";
  rootMidi: number;
  targetMidi: number;
  direction: Direction;
  answer: Interval;
}

export interface ChordQuestion {
  kind: "chord";
  rootMidi: number;
  notes: number[];
  answer: ChordQuality;
}

export type Question = IntervalQuestion | ChordQuestion;

export const NOTE_NAMES = [
  "C",
  "C♯",
  "D",
  "E♭",
  "E",
  "F",
  "F♯",
  "G",
  "A♭",
  "A",
  "B♭",
  "B",
] as const;

export function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function midiToName(midi: number): string {
  return NOTE_NAMES[((midi % 12) + 12) % 12];
}

export type Rng = () => number;

/** Deterministic PRNG so question sets can be reproduced from a seed. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(items: readonly T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)];
}

function randomInt(min: number, max: number, rng: Rng): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Keeps the root low enough that descending questions stay audible. */
export function buildIntervalQuestion(rng: Rng = Math.random): IntervalQuestion {
  const interval = pick(INTERVALS, rng);
  const direction: Direction = rng() < 0.75 ? "ascending" : "descending";
  const maxRoot = 72 - interval.semitones;
  const rootMidi = randomInt(48, Math.max(48, maxRoot), rng);
  const targetMidi =
    direction === "ascending" ? rootMidi + interval.semitones : rootMidi - interval.semitones;

  return { kind: "interval", rootMidi, targetMidi, direction, answer: interval };
}

export function buildChordQuestion(rng: Rng = Math.random): ChordQuestion {
  const quality = pick(CHORD_QUALITIES, rng);
  const rootMidi = randomInt(48, 64, rng);

  return {
    kind: "chord",
    rootMidi,
    notes: quality.intervals.map((semitones) => rootMidi + semitones),
    answer: quality,
  };
}

export function buildQuestion(mode: Question["kind"], rng: Rng = Math.random): Question {
  return mode === "interval" ? buildIntervalQuestion(rng) : buildChordQuestion(rng);
}

export function isAnswerCorrect(question: Question, chosen: string): boolean {
  return question.kind === "interval"
    ? chosen === question.answer.short
    : chosen === question.answer.short;
}

export function describeQuestion(question: Question): string {
  if (question.kind === "interval") {
    return `${midiToName(question.rootMidi)} → ${midiToName(question.targetMidi)}`;
  }
  return `${midiToName(question.rootMidi)} ${question.answer.name}`;
}

export interface AnswerRecord {
  question: Question;
  chosen: string;
  correct: boolean;
}

export interface ScoreSummary {
  correct: number;
  total: number;
  accuracy: number;
  bestStreak: number;
}

export function summarise(answers: readonly AnswerRecord[]): ScoreSummary {
  let correct = 0;
  let streak = 0;
  let bestStreak = 0;

  for (const answer of answers) {
    if (answer.correct) {
      correct += 1;
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
    } else {
      streak = 0;
    }
  }

  return {
    correct,
    total: answers.length,
    accuracy: answers.length === 0 ? 0 : correct / answers.length,
    bestStreak,
  };
}

export function describeScore(summary: ScoreSummary): string {
  const percent = Math.round(summary.accuracy * 100);
  if (percent >= 90) return "Virtuoso";
  if (percent >= 75) return "Advanced";
  if (percent >= 55) return "Intermediate";
  if (percent >= 35) return "Developing";
  return "Beginner";
}
