import { cn } from "@/lib/utils";
import { BadgeCheck } from "lucide-react";
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

export function ArtistProfile({ artist, className }: ArtistProfileProps) {
  const currentArtist: Artist = {
    name: artist?.name ?? "",
    bio: artist?.bio ?? "",
    coverUrl: artist?.coverUrl,
    gradientPreset: artist?.gradientPreset,
  };
  const gradientClass = GRADIENT_PRESETS[currentArtist.gradientPreset || "purple-pink"];

  return (
    <article
      className={cn("card-floating overflow-hidden rounded-2xl", className)}
      aria-labelledby="artist-name"
    >
      {/* Hero Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
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
              "absolute inset-0 flex items-center justify-center bg-linear-to-br",
              gradientClass,
            )}
          >
            <div
              className="px-6 text-center font-display text-5xl font-bold tracking-tight text-white drop-shadow-lg"
              aria-hidden="true"
            >
              {currentArtist.name.toLowerCase()}.
            </div>
          </div>
        )}
        {/* Legibility scrim + name overlay */}
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent"
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end gap-2 p-5">
          <h2
            id="artist-name"
            className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-white drop-shadow-md"
          >
            {currentArtist.name}
            <BadgeCheck className="h-5 w-5 text-sky-400" aria-label="Verified artist" />
          </h2>
        </div>
      </div>

      {/* Bio Content */}
      <div className="p-6">
        <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          About the artist
        </p>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
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
    <div className={cn("card-floating animate-pulse overflow-hidden rounded-2xl", className)}>
      <div className="skeleton-shimmer aspect-[16/10] w-full" />
      <div className="space-y-4 p-6">
        <div className="skeleton-shimmer h-8 w-1/3 rounded" />
        <div className="space-y-2">
          <div className="skeleton-shimmer h-4 rounded" />
          <div className="skeleton-shimmer h-4 rounded" />
          <div className="skeleton-shimmer h-4 w-5/6 rounded" />
        </div>
      </div>
    </div>
  );
}
