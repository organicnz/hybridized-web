import type { Question } from "@/lib/audio/ear-training";
import { midiToFreq } from "@/lib/audio/ear-training";

/**
 * Web Audio playback for ear-training questions.
 *
 * Notes are rendered as a soft sine with a second partial so the timbre reads
 * clearly without sounding clinical, and every voice is released on stop.
 */

const PARTIAL_GAIN = 0.28;
const ATTACK = 0.015;
const RELEASE = 0.22;

export class NotePlayer {
  private context: AudioContext | null = null;
  private active: AudioScheduledSourceNode[] = [];

  private getContext(): AudioContext {
    this.context ??= new AudioContext();
    return this.context;
  }

  private tone(freq: number, startAt: number, duration: number, gainValue: number): void {
    const context = this.getContext();
    const oscillator = context.createOscillator();
    const overtone = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = freq;
    overtone.type = "sine";
    overtone.frequency.value = freq * 2;

    const overtoneGain = context.createGain();
    overtoneGain.gain.value = PARTIAL_GAIN;

    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(gainValue, startAt + ATTACK);
    gain.gain.setValueAtTime(gainValue, startAt + Math.max(ATTACK, duration - RELEASE));
    gain.gain.linearRampToValueAtTime(0, startAt + duration);

    oscillator.connect(gain);
    overtone.connect(overtoneGain);
    overtoneGain.connect(gain);
    gain.connect(context.destination);

    const stopAt = startAt + duration + 0.02;
    oscillator.start(startAt);
    overtone.start(startAt);
    oscillator.stop(stopAt);
    overtone.stop(stopAt);

    this.active.push(oscillator, overtone);
  }

  private clear(): void {
    for (const node of this.active) {
      try {
        node.stop();
      } catch {
        // Already stopped.
      }
    }
    this.active = [];
  }

  async resume(): Promise<void> {
    const context = this.getContext();
    if (context.state === "suspended") {
      await context.resume();
    }
  }

  async playQuestion(question: Question): Promise<void> {
    await this.resume();
    this.clear();

    const context = this.getContext();
    const now = context.currentTime + 0.05;

    if (question.kind === "interval") {
      const first = midiToFreq(question.rootMidi);
      const second = midiToFreq(question.targetMidi);
      const step = 0.42;

      if (question.direction === "ascending") {
        this.tone(first, now, step, 0.3);
        this.tone(second, now + step + 0.06, step, 0.3);
      } else {
        this.tone(second, now, step, 0.3);
        this.tone(first, now + step + 0.06, step, 0.3);
      }
      return;
    }

    for (const midi of question.notes) {
      this.tone(midiToFreq(midi), now, 1.4, 0.17);
    }
  }

  stop(): void {
    this.clear();
  }

  async close(): Promise<void> {
    this.clear();
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
  }
}
