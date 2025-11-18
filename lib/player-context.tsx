"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Database } from '@/lib/types/database.types';

type Band = Database['public']['Tables']['bands']['Row'];

interface PlayerContextType {
  currentTrack: Band | null;
  isPlaying: boolean;
  play: (track: Band) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Band | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Listen for play-track events from anywhere in the app
  useEffect(() => {
    const handlePlayTrack = (event: CustomEvent) => {
      setCurrentTrack(event.detail);
      setIsPlaying(true);
    };

    window.addEventListener('play-track', handlePlayTrack as EventListener);
    return () => window.removeEventListener('play-track', handlePlayTrack as EventListener);
  }, []);

  const play = (track: Band) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const pause = () => {
    setIsPlaying(false);
  };

  const resume = () => {
    setIsPlaying(true);
  };

  const stop = () => {
    setCurrentTrack(null);
    setIsPlaying(false);
  };

  return (
    <PlayerContext.Provider value={{ currentTrack, isPlaying, play, pause, resume, stop }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
