import Image from 'next/image'
import { cn } from '@/lib/utils'

// Predefined gradient presets that work with Tailwind's JIT compiler
const GRADIENT_PRESETS = {
  'orange-pink': 'from-orange-400 to-pink-500',
  'purple-blue': 'from-purple-400 to-blue-500',
  'pink-purple': 'from-pink-400 to-purple-500',
  'blue-cyan': 'from-blue-400 to-cyan-500',
  'purple-pink': 'from-purple-400 to-pink-400',
  'green-emerald': 'from-green-400 to-emerald-500',
} as const

type GradientPreset = keyof typeof GRADIENT_PRESETS

type Artist = {
  name: string
  bio: string
  coverUrl?: string
  gradientPreset?: GradientPreset
}

interface ArtistProfileProps {
  artist?: Artist
  className?: string
}

// Default artist data
const DEFAULT_ARTIST: Artist = {
  name: 'Hybrid',
  bio: `Hybrid is a British electronic music duo consisting of Mike and Charlotte Truman. The group was formed in 1995 by Mike Truman, Chris Healings, and Lee Mullin.

At the time they were primarily known as a breakbeat collective, although they overlapped considerably with progressive house and trance.

The band are known for their cinematic approach to electronic music, with orchestral flourishes and dramatic builds that have made them a favorite for film and game soundtracks.`,
  gradientPreset: 'green-emerald'
}

export function ArtistProfile({ artist, className }: ArtistProfileProps) {
  const currentArtist = artist || DEFAULT_ARTIST
  const gradientClass = GRADIENT_PRESETS[currentArtist.gradientPreset || 'purple-pink']

  return (
    <div 
      className={cn("bg-zinc-900/50 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10", className)}
      role="article"
      aria-labelledby="artist-name"
    >
      {/* Hero Image */}
      <div className="relative h-56 flex items-center justify-center overflow-hidden">
        {currentArtist.coverUrl ? (
          <Image 
            src={currentArtist.coverUrl} 
            alt={`${currentArtist.name} profile image`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 35vw"
          />
        ) : (
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br flex items-center justify-center",
            gradientClass
          )}>
            <div className="text-black text-6xl font-bold drop-shadow-lg" aria-hidden="true">
              {currentArtist.name.toLowerCase()}.
            </div>
          </div>
        )}
      </div>

      {/* Bio Content */}
      <div className="p-6">
        <h2 id="artist-name" className="text-2xl font-bold text-white mb-4">
          {currentArtist.name}
        </h2>
        <div className="text-white/70 space-y-3 leading-relaxed text-sm">
          {currentArtist.bio.split('\n\n').map((paragraph, index) => (
            <p key={index} className="text-balance">{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ArtistProfileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-zinc-900/50 rounded-xl overflow-hidden animate-pulse border border-white/10", className)}>
      <div className="h-56 bg-white/5" />
      <div className="p-6 space-y-4">
        <div className="h-8 bg-white/10 rounded w-1/3" />
        <div className="space-y-2">
          <div className="h-4 bg-white/10 rounded" />
          <div className="h-4 bg-white/10 rounded" />
          <div className="h-4 bg-white/10 rounded w-5/6" />
        </div>
      </div>
    </div>
  )
}
