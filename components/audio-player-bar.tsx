"use client";

import { useAudioPlayer } from "@/lib/audio-player-context";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp, ListMusic, Trash2, Volume2, VolumeX, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AudioEqualizer } from "./audio-equalizer";
import { CustomAudioPlayer } from "./custom-audio-player";

export function AudioPlayerBar() {
  const {
    currentTrack,
    setCurrentTrack,
    setPlaylist,
    playPlaylist,
    playNext,
    playPrevious,
    playlist,
    currentIndex,
    currentTime,
    setCurrentTime,
    volume,
    setVolume,
    shouldAutoPlay,
    setIsPlaying,
    audioRef,
  } = useAudioPlayer();

  const [isMuted, setIsMuted] = useState(false);
  const [volumePopoverOpen, setVolumePopoverOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const volumePopoverRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (volumePopoverRef.current && !volumePopoverRef.current.contains(event.target as Node)) {
        setVolumePopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMute = useCallback(() => {
    if (!audioRef?.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioRef.current.muted = newMuted;
  }, [isMuted, audioRef]);

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      setVolume(newVolume);
      if (audioRef?.current) {
        audioRef.current.volume = newVolume;
      }
      if (newVolume > 0 && isMuted) {
        setIsMuted(false);
        if (audioRef?.current) {
          audioRef.current.muted = false;
        }
      }
    },
    [setVolume, isMuted, audioRef],
  );

  const handleSelectTrack = useCallback(
    (index: number) => {
      if (index === currentIndex) return;
      playPlaylist(playlist, index);
    },
    [playPlaylist, playlist, currentIndex],
  );

  const handleRemoveTrack = useCallback(
    (index: number) => {
      const next = playlist.filter((_, i) => i !== index);
      if (next.length === 0) {
        setCurrentTrack(null);
        return;
      }
      const nextIndex =
        index < currentIndex ? currentIndex - 1 : index === currentIndex ? 0 : currentIndex;
      setPlaylist(next, Math.max(0, Math.min(nextIndex, next.length - 1)));
    },
    [playlist, currentIndex, setPlaylist, setCurrentTrack],
  );

  const handleMoveToTop = useCallback(
    (index: number) => {
      if (index <= 0) return;
      const track = playlist[index];
      const next = [track, ...playlist.filter((_, i) => i !== index)];
      const nextIndex =
        index === currentIndex ? 0 : currentIndex < index ? currentIndex + 1 : currentIndex;
      setPlaylist(next, nextIndex);
    },
    [playlist, currentIndex, setPlaylist],
  );

  const handleClearQueue = useCallback(() => {
    setCurrentTrack(null);
    setQueueOpen(false);
  }, [setCurrentTrack]);

  if (!currentTrack) {
    return null;
  }

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="surface-shell fixed inset-x-0 bottom-0 z-50 border-t shadow-player"
    >
      {/* Subtle brand glow line */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-purple-500/50 to-transparent"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-7xl p-3 sm:p-4">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Track info */}
          <div className="glass flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-3 py-2 sm:max-w-xs">
            {currentTrack.coverUrl && (
              <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl ring-1 ring-border">
                <Image
                  src={currentTrack.coverUrl}
                  alt=""
                  width={44}
                  height={44}
                  className="h-full w-full object-cover"
                />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-foreground">
                {currentTrack.title}
              </h3>
              <p className="truncate text-xs text-muted-foreground">{currentTrack.artist}</p>
            </div>
          </div>

          {/* Audio Player */}
          <div className="glass min-w-0 flex-1 rounded-2xl px-3 py-2 sm:px-4 sm:py-3">
            {audioRef && (
              <CustomAudioPlayer
                src={currentTrack.audioUrl}
                autoPlay={shouldAutoPlay}
                volume={volume}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={setCurrentTime}
                onEnded={playNext}
                onNext={playNext}
                onPrevious={playPrevious}
                showSkipControls={playlist.length > 1}
                audioRef={audioRef as React.RefObject<HTMLAudioElement | null>}
                initialTime={currentTime}
              />
            )}
          </div>

          {/* Right Controls */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Volume Popover */}
            <div className="relative" ref={volumePopoverRef}>
              <button
                type="button"
                onClick={() => setVolumePopoverOpen(!volumePopoverOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground"
                aria-label={isMuted ? "Unmute" : "Mute"}
                aria-expanded={volumePopoverOpen}
              >
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>

              <AnimatePresence>
                {volumePopoverOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.16 }}
                    className="card-overlay absolute bottom-full right-0 mb-2 w-44 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={toggleMute}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={isMuted ? "Unmute" : "Mute"}
                      >
                        {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                      </button>
                      <span className="w-10 text-right font-mono text-xs text-muted-foreground">
                        {Math.round(volume * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(Number.parseFloat(e.target.value))}
                      className="slider-polished w-full"
                      style={{
                        background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${(isMuted ? 0 : volume) * 100}%, hsl(var(--muted)) ${(isMuted ? 0 : volume) * 100}%, hsl(var(--muted)) 100%)`,
                      }}
                      aria-label="Volume"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div
              className="h-8 w-px bg-linear-to-b from-transparent via-border to-transparent"
              aria-hidden="true"
            />

            {/* Queue Button */}
            <button
              type="button"
              onClick={() => setQueueOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-accent/40 text-muted-foreground transition-all duration-200 hover:border-primary/40 hover:text-foreground hover:shadow-glow"
              aria-label="Open queue"
            >
              <ListMusic className="h-4 w-4" />
            </button>

            <div
              className="hidden h-8 w-px bg-linear-to-b from-transparent via-border to-transparent sm:block"
              aria-hidden="true"
            />

            {/* Equalizer */}
            <div className="hidden sm:block">
              {audioRef && <AudioEqualizer audioRef={audioRef} />}
            </div>

            <div
              className="h-8 w-px bg-linear-to-b from-transparent via-border to-transparent"
              aria-hidden="true"
            />

            {/* Close button */}
            <button
              type="button"
              onClick={() => setCurrentTrack(null)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-accent/40 text-muted-foreground transition-all duration-200 hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
              aria-label="Close player"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Queue Drawer */}
      <AnimatePresence>
        {queueOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setQueueOpen(false)}
              aria-hidden="true"
            />
            <motion.dialog
              open
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="surface-shell fixed bottom-0 left-auto right-0 top-0 z-50 m-0 flex h-full max-h-none w-full max-w-md flex-col border-l p-0 shadow-overlay"
              aria-label="Play queue"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-border p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ListMusic className="h-4 w-4 text-primary" />
                  Up Next
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                    {playlist.length}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => setQueueOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground"
                  aria-label="Close queue"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Queue List */}
              <div className="scrollbar-thin flex-1 overflow-y-auto p-2">
                {playlist.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
                    <ListMusic className="mb-4 h-12 w-12 text-muted-foreground/30" />
                    <p>Queue is empty</p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                      Play something to add it here
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {playlist.map((track, index) => (
                      <li
                        key={track.id}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors duration-200",
                          index === currentIndex
                            ? "border-primary/30 bg-primary/10"
                            : "border-transparent bg-accent/30 hover:border-border hover:bg-accent",
                        )}
                      >
                        {/* Track info */}
                        {track.coverUrl ? (
                          <button
                            type="button"
                            onClick={() => handleSelectTrack(index)}
                            className="shrink-0 rounded-lg ring-1 ring-border"
                            aria-label={`Play ${track.title}`}
                          >
                            <Image
                              src={track.coverUrl}
                              alt=""
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleSelectTrack(index)}
                          className="min-w-0 flex-1 text-left"
                          aria-label={`Play ${track.title}`}
                        >
                          <p
                            className={cn(
                              "truncate text-sm font-medium",
                              index === currentIndex ? "text-primary" : "text-foreground",
                            )}
                          >
                            {track.title}
                          </p>
                          <p
                            className={cn(
                              "truncate text-xs",
                              index === currentIndex ? "text-primary/70" : "text-muted-foreground",
                            )}
                          >
                            {track.artist}
                          </p>
                        </button>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => handleMoveToTop(index)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground"
                              aria-label={`Move ${track.title} to top`}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveTrack(index)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                            aria-label={`Remove ${track.title} from queue`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Current track indicator */}
                        {index === currentIndex && (
                          <span
                            className="absolute -left-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary"
                            aria-hidden="true"
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Clear queue button */}
              {playlist.length > 0 && (
                <div className="border-t border-border p-3">
                  <button
                    type="button"
                    onClick={handleClearQueue}
                    className="btn btn-outline w-full"
                  >
                    Clear Queue
                  </button>
                </div>
              )}
            </motion.dialog>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
