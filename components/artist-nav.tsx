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
  className?: string
}

export function ArtistNav({ 
  activeArtist = 'Hybrid',
  className 
}: ArtistNavProps) {
  const getArtistSlug = (artist: string) => {
    return artist.toLowerCase().replace(/\s+/g, '-');
  };

  return (
    <nav 
      className={cn("bg-zinc-900/50 backdrop-blur-sm border-b border-white/5 h-14 px-6 flex items-center gap-8 overflow-x-auto scrollbar-hide", className)}
      role="navigation"
      aria-label="Artist navigation"
    >
      {ARTISTS.map((artist) => (
        <a
          key={artist}
          href={`/home/${getArtistSlug(artist)}`}
          className={cn(
            "whitespace-nowrap text-sm font-semibold pb-4 border-b-2 transition-all",
            activeArtist === artist 
              ? 'text-white border-[#1DB954]' 
              : 'text-white/60 border-transparent hover:text-white hover:border-white/20'
          )}
          aria-current={activeArtist === artist ? 'page' : undefined}
        >
          {artist}
        </a>
      ))}
    </nav>
  )
}
