"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database.types";

type Band = Database['public']['Tables']['bands']['Row'];

interface PersistentPlayerProps {
  currentTrack: Band | null;
  onClose: () => void;
}

export function PersistentPlayer({ currentTrack, onClose }: PersistentPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Enable hardware acceleration for iframe
    if (iframeRef.current) {
      iframeRef.current.style.transform = 'translateZ(0)';
      iframeRef.current.style.willChange = 'transform';
    }
  }, [currentTrack]);

  if (!currentTrack || !currentTrack.iframe_url) return null;

  return (
    <>
      {/* Fixed Bottom Player */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#181818] border-t border-white/10 backdrop-blur-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Track Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {currentTrack.cover_url && (
                <img
                  src={currentTrack.cover_url}
                  alt={currentTrack.name || ''}
                  className="w-14 h-14 rounded object-cover flex-shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-white truncate">
                  {currentTrack.name || 'Untitled'}
                </h4>
                <p className="text-xs text-white/50 truncate">
                  {currentTrack.description || 'No description'}
                </p>
              </div>
            </div>

            {/* Player Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-white/70" />
                ) : (
                  <Volume2 className="w-4 h-4 text-white/70" />
                )}
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                aria-label={isExpanded ? 'Minimize' : 'Expand'}
              >
                <Maximize2 className="w-4 h-4 text-white/70" />
              </button>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                aria-label="Close player"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>
          </div>

          {/* Embedded Player - Always Hidden but Active */}
          <div className="hidden">
            <iframe
              ref={iframeRef}
              src={currentTrack.iframe_url}
              width="100%"
              height="166"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              className="w-full"
              title={`Player for ${currentTrack.name || 'track'}`}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              style={{
                transform: 'translateZ(0)',
                willChange: 'transform',
                backfaceVisibility: 'hidden',
              }}
            />
          </div>
        </div>
      </div>

      {/* Expanded Player Modal */}
      {isExpanded && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181818] rounded-xl max-w-4xl w-full max-h-[80vh] overflow-auto border border-white/10">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {currentTrack.name || 'Untitled'}
                  </h3>
                  <p className="text-white/70">
                    {currentTrack.description || 'No description'}
                  </p>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Full Player */}
              <div className="bg-black/20 rounded-lg overflow-hidden">
                <iframe
                  src={currentTrack.iframe_url}
                  width="100%"
                  height="400"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  className="w-full"
                  title={`Player for ${currentTrack.name || 'track'}`}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  style={{
                    transform: 'translateZ(0)',
                    willChange: 'transform',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer to prevent content from being hidden behind player */}
      <div className="h-20" />
    </>
  );
}
