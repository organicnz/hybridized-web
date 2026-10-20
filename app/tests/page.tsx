import { AppShell } from "@/components/app-shell";
import { EarTraining } from "@/components/ear-training";

import { AudioLines, Music } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Musical Tests",
  description:
    "Train your ear with interval recognition and chord quality tests, rendered in the browser with the Web Audio API.",
};

const UPCOMING = [
  {
    icon: Music,
    title: "Genre Detective",
    description: "Identify the genre from a short audio clip",
    accent: "text-pink-400",
  },
  {
    icon: AudioLines,
    title: "Rhythm Master",
    description: "Tap back a rhythm you just heard",
    accent: "text-cyan-400",
  },
];

export default function TestsPage() {
  return (
    <AppShell>
      <div className="container mx-auto px-4 py-10 md:py-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h1 className="mb-4 bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-5xl font-black text-transparent md:text-6xl">
              Musical Tests
            </h1>
            <p className="text-lg text-purple-200/80">
              Train your ear with interactive tests. All audio is synthesised in your browser — no
              downloads, no sign-up.
            </p>
          </div>

          <EarTraining />

          <section className="mt-16">
            <h2 className="mb-6 text-center text-2xl font-bold text-white">
              More tests coming soon
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {UPCOMING.map(({ icon: Icon, title, description, accent }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm"
                >
                  <div
                    className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-black/30 ${accent}`}
                  >
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-bold text-white/80">{title}</h3>
                  <p className="mt-2 text-sm text-white/50">{description}</p>
                  <p className="mt-4 inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-medium text-white/40">
                    In development
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
