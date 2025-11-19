"use client";

import type { Database } from "@/lib/types/database.types";
import { Calendar, Clock, MoreVertical, Play, Music } from "lucide-react";
import { cn } from "@/lib/utils";

type HybridizedItem = Database["public"]["Tables"]["bands"]["Row"];

interface MixListProps {
  items: HybridizedItem[];
  onPlay?: (item: HybridizedItem) => void;
  onMenuClick?: (item: HybridizedItem) => void;
  className?: string;
}

export function MixList({
  items,
  onPlay,
  onMenuClick,
  className,
}: MixListProps) {
  if (items.length === 0) {
    return (
      <div className="bg-zinc-900/50 rounded-xl p-8 text-center border border-white/5">
        <p className="text-white/50">No mixes available</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item) => (
        <article
          key={item.id}
          className="bg-gradient-to-br from-zinc-900/80 via-zinc-800/60 to-zinc-900/80 backdrop-blur-sm rounded-lg p-4 hover:bg-zinc-800/70 transition-all border border-white/10 group relative overflow-hidden"
        >
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-pink-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:via-pink-500/5 group-hover:to-blue-500/5 transition-all duration-300 pointer-events-none" />

          <div className="flex items-center gap-4 relative">
            {/* Cover Image */}
            {item.cover_url && (
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
                <img
                  src={item.cover_url}
                  alt={item.name || "Mix cover"}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* Title */}
              <h3 className="font-semibold text-white truncate mb-1 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all">
                {item.name || "Untitled Mix"}
              </h3>

              {/* Description */}
              {item.description && (
                <p className="text-xs text-white/50 truncate mb-2">
                  {item.description}
                </p>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-3 text-xs text-white/40">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" aria-hidden="true" />
                  <time dateTime={item.created_at}>
                    {new Date(item.created_at).toLocaleDateString("en-CA")}
                  </time>
                </div>
                {item.formula && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 rounded border border-purple-400/30">
                    <Music
                      className="w-3 h-3 text-purple-300"
                      aria-hidden="true"
                    />
                    <span className="text-purple-300 font-mono">
                      {item.formula}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => onMenuClick?.(item)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                aria-label={`More options for ${item.name || "mix"}`}
              >
                <MoreVertical className="w-4 h-4 text-white/70" />
              </button>
              <button
                onClick={() => onPlay?.(item)}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-green-500 hover:from-green-300 hover:to-green-400 hover:scale-110 flex items-center justify-center transition-all shadow-lg group-hover:shadow-green-500/50"
                aria-label={`Play ${item.name || "mix"}`}
              >
                <Play className="w-4 h-4 text-black ml-0.5" fill="black" />
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function MixListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-zinc-900/50 rounded-lg p-4 animate-pulse border border-white/5"
        >
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
  );
}
