'use client'

import { X, Play, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useCallback, useState, useMemo, memo, useRef, useEffect } from 'react'

interface NowPlayingProps {
  artistName?: string
  trackName?: string
  artistImage?: string
  currentTime?: number
  duration?: number
  isPlaying?: boolean
  onClose?: () => void
  onPlayPause?: () => void
  onSeek?: (time: number) => void
  className?: string
}

const AVATAR_SIZE = 64
const SEEK_STEP_PERCENTAGE = 0.05

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const ArtistAvatar = memo(function ArtistAvatar({ name, image }: { name: string; image?: string }) {
  const [imageError, setImageError] = useState(false)

  return (
    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg">
      {image && !imageError ? (
        <Image 
          src={image} 
          alt={name}
          width={AVATAR_SIZE}
          height={AVATAR_SIZE}
          className="object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="text-white font-bold text-xs" aria-hidden="true">
          {/* Display artist name in lowercase with period as fallback branding */}
          {name.toLowerCase()}.
        </span>
      )}
    </div>
  )
})

export function NowPlaying({
  artistName = 'Hybrid',
  trackName = 'Hybridized',
  artistImage,
  currentTime = 0,
  duration = 0,
  isPlaying = false,
  onClose = () => {},
  onPlayPause = () => {},
  onSeek = () => {},
  className
}: NowPlayingProps) {
  // Use refs for frequently changing values to prevent callback recreation
  const currentTimeRef = useRef(currentTime)
  const durationRef = useRef(duration)
  
  useEffect(() => {
    currentTimeRef.current = currentTime
    durationRef.current = duration
  }, [currentTime, duration])

  // Memoize progress calculation
  const progress = useMemo(
    () => (duration > 0 ? (currentTime / duration) * 100 : 0),
    [currentTime, duration]
  )

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (durationRef.current === 0) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    onSeek(percentage * durationRef.current)
  }, [onSeek])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (durationRef.current === 0) return
    
    const step = durationRef.current * SEEK_STEP_PERCENTAGE
    
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        onSeek(Math.min(currentTimeRef.current + step, durationRef.current))
        break
      case 'ArrowLeft':
        e.preventDefault()
        onSeek(Math.max(currentTimeRef.current - step, 0))
        break
      case 'Home':
        e.preventDefault()
        onSeek(0)
        break
      case 'End':
        e.preventDefault()
        onSeek(durationRef.current)
        break
      case ' ':
      case 'Enter':
        e.preventDefault()
        onPlayPause()
        break
    }
  }, [onSeek, onPlayPause])

  return (
    <div className={cn("bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 shadow-2xl border border-white/10", className)}>
      <div className="flex items-start gap-4 mb-6">
        <ArtistAvatar name={artistName} image={artistImage} />

        {/* Artist Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-white truncate">{artistName}</h3>
          <p className="text-sm text-white/60 truncate">{trackName}</p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors flex-shrink-0"
          aria-label="Close now playing"
        >
          <X className="w-4 h-4 text-white/80" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div
            role="slider"
            aria-valuemin={0}
            aria-valuemax={Math.floor(duration)}
            aria-valuenow={Math.floor(currentTime)}
            aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
            aria-label="Seek position"
            tabIndex={0}
            onClick={handleSeek}
            onKeyDown={handleKeyDown}
            className="w-full h-1 bg-white/20 rounded-full mb-2 cursor-pointer group relative focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            <div 
              className="h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all group-hover:from-purple-300 group-hover:to-pink-300 relative pointer-events-none"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity shadow-lg" />
            </div>
          </div>
          <div className="flex justify-between text-xs text-white/50 font-medium">
            <time>{formatTime(currentTime)}</time>
            <time>{formatTime(duration)}</time>
          </div>
        </div>

        {/* Play/Pause Button */}
        <button 
          onClick={onPlayPause}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center hover:from-purple-300 hover:to-pink-300 hover:scale-105 transition-all shadow-lg flex-shrink-0"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-white" fill="white" />
          ) : (
            <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
          )}
        </button>
      </div>
    </div>
  )
}
