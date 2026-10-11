"use client";

import {
  buildQuestion,
  CHORD_QUALITIES,
  describeQuestion,
  describeScore,
  INTERVALS,
  isAnswerCorrect,
  summarise,
  type AnswerRecord,
  type Question,
} from "@/lib/audio/ear-training";
import { NotePlayer } from "@/lib/audio/note-player";
import { AudioLines, CheckCircle2, Music, Play, RotateCcw, XCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Mode = "interval" | "chord";

const QUESTION_COUNT = 10;

const MODES: { id: Mode; label: string; blurb: string; icon: typeof Music }[] = [
  {
    id: "interval",
    label: "Interval Recognition",
    blurb: "Hear two notes played in sequence and name the distance between them.",
    icon: AudioLines,
  },
  {
    id: "chord",
    label: "Chord Quality",
    blurb: "Hear a triad played together and identify its quality.",
    icon: Music,
  },
];

function optionsFor(question: Question): { short: string; name: string }[] {
  if (question.kind === "interval") {
    return INTERVALS.map(({ short, name }) => ({ short, name }));
  }
  return CHORD_QUALITIES.map(({ short, name }) => ({ short, name }));
}

export function EarTraining() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [chosen, setChosen] = useState<string | null>(null);
  const playerRef = useRef<NotePlayer | null>(null);

  const finished = answers.length >= QUESTION_COUNT;

  useEffect(() => {
    const player = new NotePlayer();
    playerRef.current = player;
    return () => {
      void player.close();
      playerRef.current = null;
    };
  }, []);

  const replay = useCallback(() => {
    if (question && playerRef.current) {
      void playerRef.current.playQuestion(question);
    }
  }, [question]);

  const start = (next: Mode) => {
    const fresh = buildQuestion(next);
    setMode(next);
    setAnswers([]);
    setChosen(null);
    setQuestion(fresh);
    if (playerRef.current) {
      void playerRef.current.playQuestion(fresh);
    }
  };

  const choose = (short: string) => {
    if (!question || chosen) return;
    setChosen(short);

    const record: AnswerRecord = {
      question,
      chosen: short,
      correct: isAnswerCorrect(question, short),
    };

    const nextAnswers = [...answers, record];
    setAnswers(nextAnswers);

    if (nextAnswers.length >= QUESTION_COUNT) return;

    window.setTimeout(() => {
      setChosen(null);
      setQuestion(buildQuestion(mode ?? "interval"));
    }, 900);
  };

  const replayNew = () => {
    setChosen(null);
    const fresh = buildQuestion(mode ?? "interval");
    setQuestion(fresh);
    if (playerRef.current) {
      void playerRef.current.playQuestion(fresh);
    }
  };

  const summary = summarise(answers);

  if (!mode) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {MODES.map(({ id, label, blurb, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => start(id)}
            className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-8 text-left backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-purple-400/40 hover:shadow-xl hover:shadow-purple-500/10"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <Icon className="h-6 w-6 text-purple-300" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-bold text-white">{label}</h3>
            <p className="mt-2 text-sm text-white/60">{blurb}</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-purple-300">
              <Play className="h-4 w-4" aria-hidden="true" />
              Start test
            </span>
          </button>
        ))}
      </div>
    );
  }

  if (finished) {
    const percent = Math.round(summary.accuracy * 100);
    return (
      <div className="rounded-2xl border border-white/15 bg-white/5 p-8 text-center backdrop-blur-sm">
        <div className="text-6xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          {percent}%
        </div>
        <p className="mt-2 text-sm text-white/60">
          {summary.correct} of {summary.total} correct · best streak {summary.bestStreak}
        </p>
        <h3 className="mt-4 text-2xl font-bold text-white">{describeScore(summary)}</h3>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setMode(null)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-medium text-white/80 transition-colors hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Try another test
          </button>
          <button
            type="button"
            onClick={() => setAnswers([])}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-medium text-white transition-all hover:from-purple-600 hover:to-pink-600"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            Run it again
          </button>
        </div>
      </div>
    );
  }

  const options = question ? optionsFor(question) : [];
  const correct = chosen !== null && question !== null && isAnswerCorrect(question, chosen);

  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm sm:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-white/50">
          {MODES.find((m) => m.id === mode)?.label}
        </h3>
        <span className="text-sm tabular-nums text-white/50">
          {answers.length + 1} / {QUESTION_COUNT}
        </span>
      </div>

      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
          style={{ width: `${(answers.length / QUESTION_COUNT) * 100}%` }}
        />
      </div>

      <div className="mb-6 flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={replay}
          className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 transition-transform hover:scale-105 active:scale-95"
          aria-label="Play the question again"
        >
          <Play className="h-8 w-8" aria-hidden="true" />
        </button>
        <p className="text-sm text-white/40">Tap to hear it again</p>
      </div>

      {chosen && question && (
        <output
          className={`mb-6 flex items-center justify-center gap-2 text-sm font-medium ${
            correct ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {correct ? (
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          ) : (
            <XCircle className="h-4 w-4" aria-hidden="true" />
          )}
          {correct
            ? `Correct — ${question.answer.name}`
            : `It was ${question.answer.name} (${describeQuestion(question)})`}
        </output>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((option) => {
          const isAnswer = question !== null && option.short === question.answer.short;
          const isChosen = chosen === option.short;
          const reveal = chosen !== null && isAnswer;

          return (
            <button
              key={option.short}
              type="button"
              onClick={() => choose(option.short)}
              disabled={chosen !== null}
              className={`rounded-xl border px-3 py-3 text-sm font-medium transition-all ${
                reveal
                  ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-200"
                  : isChosen
                    ? "border-red-400/50 bg-red-400/15 text-red-200"
                    : "border-white/10 bg-white/5 text-white/80 hover:border-purple-400/40 hover:bg-white/10"
              } disabled:cursor-default`}
            >
              {option.name}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={replayNew}
          className="text-sm text-white/40 underline-offset-4 transition-colors hover:text-white/70 hover:underline"
        >
          Skip this question
        </button>
      </div>
    </div>
  );
}
