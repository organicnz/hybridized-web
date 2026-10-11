import { cn } from "@/lib/utils";
import Image from "next/image";

// Predefined gradient presets that work with Tailwind's JIT compiler
const GRADIENT_PRESETS = {
  "orange-pink": "from-orange-400 to-pink-500",
  "purple-blue": "from-purple-400 to-blue-500",
  "pink-purple": "from-pink-400 to-purple-500",
  "blue-cyan": "from-blue-400 to-cyan-500",
  "purple-pink": "from-purple-400 to-pink-400",
  "green-emerald": "from-green-400 to-emerald-500",
} as const;

type GradientPreset = keyof typeof GRADIENT_PRESETS;

type Artist = {
  name: string;
  bio: string;
  coverUrl?: string;
  gradientPreset?: GradientPreset;
};

interface ArtistProfileProps {
  artist?: Artist;
  className?: string;
}

// Default artist data
const DEFAULT_ARTIST: Artist = {
  name: "Hybrid",
  bio: `Hybrid is a British electronic music duo consisting of Mike and Charlotte Truman. The group was formed in 1995 by Mike Truman, Chris Healings, and Lee Mullin.

At the time they were primarily known as a breakbeat collective, although they overlapped considerably with progressive house and trance.

The band are known for their cinematic approach to electronic music, with orchestral flourishes and dramatic builds that have made them a favorite for film and game soundtracks.`,
  gradientPreset: "green-emerald",
};

export function ArtistProfile({ artist, className }: ArtistProfileProps) {
  const currentArtist = {
    ...DEFAULT_ARTIST,
    ...artist,
  };
  const gradientClass = GRADIENT_PRESETS[currentArtist.gradientPreset || "purple-pink"];

  return (
    <article className={cn("card-floating", className)} aria-labelledby="artist-name">
      {/* Hero Image */}
      <div className="relative h-[322px] flex items-center justify-center overflow-hidden rounded-t-xl">
        {currentArtist.coverUrl ? (
          <Image
            src={currentArtist.coverUrl}
            alt={`${currentArtist.name} profile image`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 35vw"
            priority
          />
        ) : (
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br flex items-center justify-center",
              gradientClass,
            )}
          >
            <div className="text-black text-6xl font-bold drop-shadow-lg" aria-hidden="true">
              {currentArtist.name.toLowerCase()}.
            </div>
          </div>
        )}
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Bio Content */}
      <div className="p-6">
        <h2 id="artist-name" className="text-fluid-lg font-bold text-foreground mb-4">
          {currentArtist.name}
        </h2>
        <div className="text-muted-foreground space-y-3 leading-relaxed text-fluid-body-sm">
          {currentArtist.bio.split("\n\n").map((paragraph) => (
            <p key={paragraph} className="text-balance">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </article>
  );
}

export function ArtistProfileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("card-floating animate-pulse", className)}>
      <div className="h-[322px] bg-muted" />
      <div className="p-6 space-y-4">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded" />
          <div className="h-4 bg-muted rounded" />
          <div className="h-4 bg-muted rounded w-5/6" />
        </div>
      </div>
    </div>
  );
}
