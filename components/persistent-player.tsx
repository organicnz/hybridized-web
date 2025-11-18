"use client";

import { usePlayer } from '@/lib/player-context';
import { Play, Pause, X, Maximize2 } from 'lucide-react';
import { useState } from 'react';

export function PersistentPlayer() {
  const { currentTrack, isPlaying, pause, resume, stop } = usePlayer();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!currentTrack) return null;

  return (
    <>
      {/* Fixed Bottom Player */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#181818] border-t border-white/10 backdrop-blur-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
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
                aria-label="Expand player"
              >
                <Maximize2 className="w-4 h-4 text-white" />
              </button>
              
              <button
                onClick={isPlaying ? pause : resume}
                className="w-10 h-10 rounded-full bg-[#1DB954] hover:bg-[#1ed760] flex items-center justify-center transition-all hover:scale-105"
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
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Close player"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Expanded Player */}
          {isExpanded && currentTrack.iframe_url && (
            <div className="mt-4 rounded-lg overflow-hidden">
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
      <div className={isExpanded ? "h-[250px]" : "h-[80px]"} />
    </>
  );
}
