'use client'

import { cn } from '@/lib/utils'

const ARTISTS = [
  'Hybrid',
  'Alex Hall',
  'Deepsky',
  'Benz & MD',
  'Burufunk',
  'Digital Witchcraft',
  'DjKIRA',
  'Grayarea',
  'J-Slyde',
  'James Warren',
  'Jason Dunne',
  'KiloWatts',
  'Micah',
  'Nick Lewis',
  'Noel Sanger',
  'NuBreed'
] as const

interface ArtistNavProps {
  activeArtist?: string
  onArtistChange?: (artist: string) => void
  className?: string
}

export function ArtistNav({ 
  activeArtist = 'Hybrid', 
  onArtistChange,
  className 
}: ArtistNavProps) {
  return (
    <nav 
      className={cn("bg-zinc-900/50 backdrop-blur-sm border-b border-white/5 h-14 px-6 flex items-center gap-8 overflow-x-auto scrollbar-hide", className)}
      role="navigation"
      aria-label="Artist navigation"
    >
      {ARTISTS.map((artist) => (
        <button
          key={artist}
          onClick={() => onArtistChange?.(artist)}
          className={cn(
            "whitespace-nowrap text-sm font-semibold pb-4 border-b-2 transition-all",
            activeArtist === artist 
              ? 'text-white border-green-400' 
              : 'text-white/60 border-transparent hover:text-white hover:border-white/20'
          )}
          aria-current={activeArtist === artist ? 'page' : undefined}
        >
          {artist}
        </button>
      ))}
    </nav>
  )
}
