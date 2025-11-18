'use client'

import type { Database } from '@/lib/types/database.types'
import { Calendar, Clock, MoreVertical, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

type HybridizedItem = Database['public']['Tables']['hybridized']['Row']

interface MixListProps {
  items: HybridizedItem[]
  onPlay?: (item: HybridizedItem) => void
  onMenuClick?: (item: HybridizedItem) => void
  className?: string
}

export function MixList({ items, onPlay, onMenuClick, className }: MixListProps) {
  if (items.length === 0) {
    return (
      <div className="bg-zinc-900/50 rounded-xl p-8 text-center border border-white/5">
        <p className="text-white/50">No mixes available</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item) => (
        <article
          key={item.id}
          className="bg-zinc-900/50 backdrop-blur-sm rounded-lg p-4 hover:bg-zinc-800/70 transition-all border border-white/5 group"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h3 className="font-semibold text-white truncate mb-2 group-hover:text-green-400 transition-colors">
                {item.name || 'Untitled Mix'}
              </h3>

              {/* Metadata */}
              <div className="flex items-center gap-4 text-sm text-white/50">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                  <time dateTime={item.created_at}>
                    {new Date(item.created_at).toLocaleDateString('en-CA')}
                  </time>
                </div>
                {item.formula && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{item.formula}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button 
                onClick={() => onMenuClick?.(item)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                aria-label={`More options for ${item.name || 'mix'}`}
              >
                <MoreVertical className="w-4 h-4 text-white/70" />
              </button>
              <button 
                onClick={() => onPlay?.(item)}
                className="w-10 h-10 rounded-full bg-green-400 hover:bg-green-300 hover:scale-105 flex items-center justify-center transition-all shadow-lg"
                aria-label={`Play ${item.name || 'mix'}`}
              >
                <Play className="w-4 h-4 text-black ml-0.5" fill="black" />
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export function MixListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-zinc-900/50 rounded-lg p-4 animate-pulse border border-white/5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-white/10 rounded w-3/4" />
              <div className="flex gap-4">
                <div className="h-4 bg-white/10 rounded w-24" />
                <div className="h-4 bg-white/10 rounded w-16" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-white/10 rounded-full" />
              <div className="w-10 h-10 bg-white/10 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
