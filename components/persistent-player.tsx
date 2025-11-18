"use client";

import { usePlayer } from '@/lib/player-context';
import { Play, Pause, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function PersistentPlayer() {
  const { currentTrack, isPlaying, pause, resume, stop } = usePlayer();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!currentTrack) return null;

  return (
    <>
      {/* Fixed Bottom Player */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-[#181818] to-[#282828] border-t border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Player Header */}
          <div className="flex items-center gap-4 mb-3">
            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-white truncate">
                {currentTrack.name || 'Untitled'}
              </h4>
              <p className="text-xs text-white/50 truncate">
                {currentTrack.description || 'No description'}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label={isExpanded ? 'Collapse player' : 'Expand player'}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-white" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-white" />
                )}
              </button>
              
              <button
                onClick={isPlaying ? pause : resume}
                className="w-10 h-10 rounded-full bg-[#1DB954] hover:bg-[#1ed760] flex items-center justify-center transition-all hover:scale-105 shadow-lg"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-black" fill="black" />
                ) : (
                  <Play className="w-5 h-5 text-black ml-0.5" fill="black" />
                )}
              </button>

              <button
                onClick={stop}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-red-500/20 flex items-center justify-center transition-colors group"
                aria-label="Close player"
              >
                <X className="w-4 h-4 text-white group-hover:text-red-400" />
              </button>
            </div>
          </div>

          {/* Embedded Player */}
          {isExpanded && currentTrack.iframe_url && (
            <div className="rounded-lg overflow-hidden bg-black/20 shadow-inner">
              <iframe
                src={currentTrack.iframe_url}
                width="100%"
                height="166"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                className="w-full"
                title={`Player for ${currentTrack.name || 'mix'}`}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </div>
          )}
        </div>
      </div>

      {/* Spacer to prevent content from being hidden behind player */}
      <div className={isExpanded ? "h-[300px]" : "h-[80px]"} />
    </>
  );
}
