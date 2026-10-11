"use client";

import { useAudioPlayer } from "@/lib/audio-player-context";
import { Volume2, VolumeX, X, ChevronUp, ListMusic, Trash2, GripVertical } from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AudioEqualizer } from "./audio-equalizer";
import { CustomAudioPlayer } from "./custom-audio-player";
import { cn } from "@/lib/utils";

const WAVEFORM_BARS = 64;

function generateWaveformBars(seed: string): number[] {
  // Deterministic pseudo-random based on track ID
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const bars: number[] = [];
  for (let i = 0; i < WAVEFORM_BARS; i++) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    bars.push(0.15 + (hash / 0xffffffff) * 0.85);
  }
  return bars;
}

export function AudioPlayerBar() {
  const {
    currentTrack,
    setCurrentTrack,
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

  if (!currentTrack) {
    return null;
  }

  const _waveformBars = generateWaveformBars(currentTrack.id);
  const _progress = audioRef?.current?.duration ? currentTime / audioRef.current.duration : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Glassmorphism background with gradient */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-0 bg-gradient-to-t from-black/95 via-purple-900/20 to-transparent backdrop-blur-xl border-t border-white/10"
        style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
      />

      {/* Animated gradient overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-blue-500/5 animate-pulse"
        style={{ transform: "translateZ(0)" }}
      />

      <div className="relative max-w-7xl mx-auto p-4">
        <div className="flex items-center gap-4">
          {/* Track info with glassmorphism */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
            className="flex items-center gap-3 min-w-0 flex-1 max-w-md px-3 py-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg"
            style={{ transform: "translateZ(0)", willChange: "transform" }}
          >
            {currentTrack.coverUrl && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative flex-shrink-0 rounded-lg overflow-hidden shadow-xl ring-2 ring-white/10"
                style={{ transform: "translateZ(0)", willChange: "transform" }}
              >
                <Image
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  width={56}
                  height={56}
                  className="rounded-lg"
                />
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent" />
              </motion.div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-white font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis drop-shadow-lg">
                {currentTrack.title}
              </h3>
              <p className="text-white/60 text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                {currentTrack.artist}
              </p>
            </div>
          </motion.div>

          {/* Audio Player with glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.15 }}
            className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-md border border-white/10 shadow-2xl"
            style={{ transform: "translateZ(0)", willChange: "transform" }}
          >
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
          </motion.div>

          {/* Right Controls Section with glassmorphism */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
            className="flex items-center gap-3 flex-shrink-0"
          >
            {/* Volume Popover */}
            <div className="relative">
              <motion.button
                type="button"
                onClick={() => setVolumePopoverOpen(!volumePopoverOpen)}
                className="text-white/70 hover:text-white transition-all duration-200 flex-shrink-0 hover:scale-110"
                style={{ transform: "translateZ(0)" }}
                aria-label={isMuted ? "Unmute" : "Mute"}
                aria-expanded={volumePopoverOpen}
              >
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </motion.button>

              <AnimatePresence>
                {volumePopoverOpen && (
                  <motion.div
                    ref={volumePopoverRef}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="absolute bottom-full right-0 mb-2 w-40"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-br from-black/95 to-purple-900/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl"
                      style={{ transform: "translateZ(0)" }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <motion.button
                          type="button"
                          onClick={toggleMute}
                          className="text-white/70 hover:text-white transition-all duration-200 flex-shrink-0 hover:scale-110"
                          aria-label={isMuted ? "Unmute" : "Mute"}
                        >
                          {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </motion.button>
                        <span className="text-xs text-white/60 w-10 text-right font-mono">
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
                        className="w-full h-2 accent-purple-500 bg-white/10 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, rgb(168 85 247) 0%, rgb(168 85 247) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.1) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.1) 100%)`,
                        }}
                        aria-label="Volume"
                      />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Divider with glow */}
            <div className="h-10 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent flex-shrink-0" />

            {/* Queue Button */}
            <motion.button
              type="button"
              onClick={() => setQueueOpen(true)}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 backdrop-blur-md border border-white/20 hover:border-purple-400/50 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-purple-500/30 flex-shrink-0 group"
              style={{ transform: "translateZ(0)", willChange: "transform" }}
              aria-label="Open queue"
            >
              <ListMusic className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
            </motion.button>

            {/* Divider with glow */}
            <div className="h-10 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent flex-shrink-0" />

            {/* Equalizer */}
            {audioRef && <AudioEqualizer audioRef={audioRef} />}

            {/* Divider with glow */}
            <div className="h-10 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent flex-shrink-0" />

            {/* Close button with glassmorphism */}
            <motion.button
              type="button"
              onClick={() => setCurrentTrack(null)}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/10 backdrop-blur-md border border-white/20 hover:border-red-400/50 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-red-500/30 flex-shrink-0 group"
              style={{ transform: "translateZ(0)", willChange: "transform" }}
              aria-label="Close player"
            >
              <X className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
            </motion.button>
          </motion.div>
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
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-20 z-50 w-full max-w-md bg-gradient-to-b from-black/95 to-black/90 backdrop-blur-xl border-l border-white/10 shadow-2xl overflow-y-auto"
              style={{ transform: "translateZ(0)" }}
            >
              {/* Drawer Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-b from-black/95 to-transparent backdrop-blur-xl">
                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                  <ListMusic className="w-4 h-4 text-primary" />
                  Up Next
                  <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded-full">
                    {playlist.length}
                  </span>
                </h3>
                <motion.button
                  type="button"
                  onClick={() => setQueueOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                  aria-label="Close queue"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-4 h-4 text-white/70" />
                </motion.button>
              </div>

              {/* Queue List */}
              <div className="p-2">
                {playlist.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center h-64 text-white/50"
                  >
                    <ListMusic className="w-12 h-12 text-white/20 mb-4" />
                    <p className="text-white/50">Queue is empty</p>
                    <p className="text-xs text-white/30 mt-1">Play something to add it here</p>
                  </motion.div>
                ) : (
                  <ul className="space-y-1">
                    {playlist.map((track, index) => (
                      <motion.li
                        key={track.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={cn(
                          "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                          index === currentIndex
                            ? "bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30"
                            : "bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10",
                        )}
                      >
                        {/* Drag handle */}
                        <div className="flex flex-col items-center justify-center text-white/30 hover:text-white/50 cursor-grab active:cursor-grabbing">
                          <GripVertical className="w-4 h-4" />
                        </div>

                        {/* Track info */}
                        {track.coverUrl && (
                          <Image
                            src={track.coverUrl}
                            alt=""
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "text-sm font-medium truncate",
                              index === currentIndex ? "text-primary" : "text-white",
                            )}
                          >
                            {track.title}
                          </p>
                          <p
                            className={cn(
                              "text-xs truncate",
                              index === currentIndex ? "text-primary/70" : "text-white/50",
                            )}
                          >
                            {track.artist}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <motion.button
                            type="button"
                            onClick={() => {
                              // Move to top of queue
                            }}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                            aria-label="Move to top"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            type="button"
                            onClick={() => {
                              // Remove from queue
                            }}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-white/60 hover:text-red-400 transition-colors"
                            aria-label="Remove from queue"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>

                        {/* Current track indicator */}
                        {index === currentIndex && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse"
                            aria-hidden="true"
                          />
                        )}
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Clear queue button */}
              {playlist.length > 0 && (
                <motion.button
                  type="button"
                  onClick={() => {
                    // Clear queue
                  }}
                  className="mx-2 mb-4 w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-sm font-medium transition-colors"
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  Clear Queue
                </motion.button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
