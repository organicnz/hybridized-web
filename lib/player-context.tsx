"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { Database } from "@/lib/types/database.types";

type Band = Database['public']['Tables']['bands']['Row'];

interface PlayerContextType {
  currentTrack: Band | null;
  setCurrentTrack: (track: Band | null) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Band | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Listen for track changes from anywhere in the app
  useEffect(() => {
    const handleSetTrack = (event: CustomEvent) => {
      setCurrentTrack(event.detail);
      setIsPlaying(true);
    };

    window.addEventListener('set-current-track', handleSetTrack as EventListener);
    return () => {
      window.removeEventListener('set-current-track', handleSetTrack as EventListener);
    };
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        setCurrentTrack,
        isPlaying,
        setIsPlaying,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
