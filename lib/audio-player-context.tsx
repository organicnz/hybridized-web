"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";

export interface Track {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl?: string;
}

interface AudioPlayerContextType {
  currentTrack: Track | null;
  playlist: Track[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  shouldAutoPlay: boolean;
  volume: number;
  audioRef: React.RefObject<HTMLAudioElement | null> | null;
  setCurrentTrack: (track: Track | null) => void;
  setPlaylist: (tracks: Track[], startIndex?: number) => void;
  playTrack: (track: Track) => void;
  playPlaylist: (tracks: Track[], startIndex?: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  pauseAudio: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "hybridized-audio-state";

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrackState] = useState<Track | null>(null);
  const [playlist, setPlaylistState] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const supabase = createClient();
  const volumeSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load state from localStorage and database on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        // Load from localStorage first
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const state = JSON.parse(saved);
          if (state.currentTrack) {
            setCurrentTrackState(state.currentTrack);
            setPlaylistState(state.playlist || []);
            setCurrentIndex(state.currentIndex || 0);
            setCurrentTime(state.currentTime || 0);
            setVolumeState(state.volume ?? 0.7);
            // Don't autoplay on page load
            setShouldAutoPlay(false);
          }
        }

        // Load volume from database if user is authenticated
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from("settings")
            .select("volume_settings")
            .eq("user_id", user.id)
            .single();

          if (!error && data?.volume_settings) {
            const volumeSettings = data.volume_settings as { master?: number };
            if (typeof volumeSettings.master === "number") {
              const dbVolume = volumeSettings.master / 100; // Convert from 0-100 to 0-1
              setVolumeState(dbVolume);
              console.log("Loaded volume from database:", dbVolume);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load audio state:", error);
      }
      setIsHydrated(true);
    };

    loadState();
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isHydrated) return;

    try {
      const state = {
        currentTrack,
        playlist,
        currentIndex,
        currentTime,
        volume,
        isPlaying: false, // Always restore as paused on page load
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save audio state:", error);
    }
  }, [currentTrack, playlist, currentIndex, currentTime, volume, isHydrated]);

  const setCurrentTrack = (track: Track | null) => {
    setCurrentTrackState(track);
    if (!track) {
      setCurrentTime(0);
      setShouldAutoPlay(false);
    }
  };

  const setPlaylist = (tracks: Track[], startIndex: number = 0) => {
    setPlaylistState(tracks);
    setCurrentIndex(startIndex);
    if (tracks.length > 0 && startIndex < tracks.length) {
      setCurrentTrackState(tracks[startIndex]);
      setCurrentTime(0);
    }
  };

  // Play a single track immediately
  const playTrack = async (track: Track) => {
    setCurrentTrackState(track);
    setPlaylistState([track]);
    setCurrentIndex(0);
    setCurrentTime(0);
    setShouldAutoPlay(true);
    setIsPlaying(true);

    // Reset autoPlay flag after a short delay to prevent re-triggering
    setTimeout(() => setShouldAutoPlay(false), 100);
  };

  // Play a playlist immediately
  const playPlaylist = async (tracks: Track[], startIndex: number = 0) => {
    setPlaylistState(tracks);
    setCurrentIndex(startIndex);
    if (tracks.length > 0 && startIndex < tracks.length) {
      setCurrentTrackState(tracks[startIndex]);
      setCurrentTime(0);
      setShouldAutoPlay(true);
      setIsPlaying(true);

      // Reset autoPlay flag after a short delay to prevent re-triggering
      setTimeout(() => setShouldAutoPlay(false), 100);
    }
  };

  const playNext = () => {
    if (playlist.length === 0) return;
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentIndex(nextIndex);
    setCurrentTrackState(playlist[nextIndex]);
    setCurrentTime(0);
    setShouldAutoPlay(true);

    // Reset autoPlay flag after a short delay to prevent re-triggering
    setTimeout(() => setShouldAutoPlay(false), 100);
  };

  const playPrevious = () => {
    if (playlist.length === 0) return;
    const prevIndex =
      currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    setCurrentTrackState(playlist[prevIndex]);
    setCurrentTime(0);
    setShouldAutoPlay(true);

    // Reset autoPlay flag after a short delay to prevent re-triggering
    setTimeout(() => setShouldAutoPlay(false), 100);
  };

  const setVolume = (vol: number) => {
    setVolumeState(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }

    // Debounce database save
    if (volumeSaveTimeoutRef.current) {
      clearTimeout(volumeSaveTimeoutRef.current);
    }

    volumeSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const volumePercent = Math.round(vol * 100); // Convert from 0-1 to 0-100

        const { error } = await supabase.from("settings").upsert(
          {
            user_id: user.id,
            volume_settings: { master: volumePercent },
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          },
        );

        if (error) {
          console.error("Error saving volume settings:", error);
        } else {
          console.log("Volume settings saved:", volumePercent);
        }
      } catch (error) {
        console.error("Error saving volume settings:", error);
      }
    }, 500); // Save after 500ms of no changes
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        playlist,
        currentIndex,
        isPlaying,
        currentTime,
        volume,
        shouldAutoPlay,
        audioRef,
        setCurrentTrack,
        setPlaylist,
        playTrack,
        playPlaylist,
        playNext,
        playPrevious,
        setIsPlaying,
        setCurrentTime,
        setVolume,
        pauseAudio,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  }
  return context;
}
