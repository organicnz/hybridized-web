"use client";

import { useSyncStatus } from "@/hooks/use-sync-status";
import { createAudioContext } from "@/lib/audio-utils";
import { createSettingsSaver, loadUserSettings } from "@/lib/settings-utils";
import { getSupabase } from "@/lib/supabase/client";
import { LogIn, Sliders } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { SyncIndicator } from "./sync-indicator";

interface AudioEqualizerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  className?: string;
}

const FREQUENCY_BANDS = [
  { freq: 60, label: "60Hz" },
  { freq: 170, label: "170Hz" },
  { freq: 310, label: "310Hz" },
  { freq: 600, label: "600Hz" },
  { freq: 1000, label: "1kHz" },
  { freq: 3000, label: "3kHz" },
  { freq: 6000, label: "6kHz" },
  { freq: 12000, label: "12kHz" },
  { freq: 14000, label: "14kHz" },
  { freq: 16000, label: "16kHz" },
];

const EQ_PRESETS = {
  Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  Rock: [5, 4, 3, 1, -1, -1, 1, 3, 4, 5],
  Pop: [2, 3, 4, 3, 1, -1, -2, -2, 2, 3],
  Jazz: [4, 3, 1, 2, -2, -2, 0, 2, 3, 4],
  Classical: [5, 4, 3, 2, -2, -2, 0, 2, 3, 4],
  Bass: [8, 7, 6, 4, 2, 0, -2, -3, -4, -4],
  Treble: [-4, -4, -3, -2, 0, 2, 4, 6, 7, 8],
  "Bass & Treble": [6, 4, 2, 0, -2, -2, 0, 2, 4, 6],
  Electronic: [5, 4, 2, 0, -2, 2, 1, 2, 4, 5],
  "Hip Hop": [6, 5, 2, 3, -1, -1, 2, 0, 3, 4],
  Vocal: [-2, -3, -2, 1, 4, 4, 3, 1, 0, -1],
  Acoustic: [5, 4, 3, 1, 2, 2, 3, 4, 4, 3],
};

export function AudioEqualizer({ audioRef, className = "" }: AudioEqualizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [filters, setFilters] = useState<BiquadFilterNode[]>([]);
  const [gains, setGains] = useState<number[]>(
    Array.from({ length: FREQUENCY_BANDS.length }, () => 0),
  );
  const [currentPreset, setCurrentPreset] = useState<string>("Flat");
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Create settings saver instance (persists across renders)
  const settingsSaverRef = useRef<ReturnType<typeof createSettingsSaver> | null>(null);
  if (!settingsSaverRef.current) {
    settingsSaverRef.current = createSettingsSaver();
  }

  // Subscribe to sync status
  const syncStatus = useSyncStatus(settingsSaverRef);

  // Load settings when user authenticates
  const loadSettings = useCallback(async () => {
    try {
      const settings = await loadUserSettings();
      if (settings?.gains) {
        setGains(settings.gains);
        setCurrentPreset("Custom");
      }
    } catch {
      // The equalizer falls back to its defaults.
    }
  }, []);

  // Check authentication status and load settings on sign-in
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const supabase = await getSupabase();
      if (cancelled) return;

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        setIsAuthenticated(!!session?.user);
        // Reload settings when user signs in
        if (event === "SIGNED_IN" && session?.user) {
          void loadSettings();
        }
      });

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled) return;
        setIsAuthenticated(!!user);
        if (user) void loadSettings();
      } catch {
        if (!cancelled) setIsAuthenticated(false);
      }

      return () => subscription.unsubscribe();
    })();

    return () => {
      cancelled = true;
    };
  }, [loadSettings]);

  // Flush pending saves on unmount
  useEffect(() => {
    const saver = settingsSaverRef.current;
    return () => {
      void saver?.flush();
    };
  }, []);

  // Resume audio context when play is attempted
  useEffect(() => {
    const audio = audioRef.current;
    if (!audioContext || !audio) return;

    const handlePlay = () => {
      if (audioContext.state === "suspended") {
        // A context that cannot be resumed stays suspended; the audio plays
        // without the equalizer rather than not at all.
        void audioContext.resume().catch(() => {});
      }
    };

    audio.addEventListener("play", handlePlay);
    return () => {
      audio.removeEventListener("play", handlePlay);
    };
  }, [audioContext, audioRef]);

  // Initialize Web Audio API
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || isInitialized) return;

    // Wait for audio element to be ready
    const timer = setTimeout(() => {
      try {
        const ctx = createAudioContext();
        if (!ctx) throw new Error("Web Audio API is not supported");

        let source: MediaElementAudioSourceNode;
        try {
          source = ctx.createMediaElementSource(audio);
        } catch {
          // Audio element already has a source node - EQ unavailable
          setInitError(true);
          void ctx.close().catch(() => {});
          setIsInitialized(true);
          return;
        }

        // Create filters for each frequency band
        const newFilters = FREQUENCY_BANDS.map((band, index) => {
          const filter = ctx.createBiquadFilter();
          filter.type =
            index === 0
              ? "lowshelf"
              : index === FREQUENCY_BANDS.length - 1
                ? "highshelf"
                : "peaking";
          filter.frequency.value = band.freq;
          filter.Q.value = 1;
          filter.gain.value = gains[index] || 0;
          return filter;
        });

        // Connect filters in series
        source.connect(newFilters[0]);
        for (let i = 0; i < newFilters.length - 1; i++) {
          newFilters[i].connect(newFilters[i + 1]);
        }
        newFilters[newFilters.length - 1].connect(ctx.destination);

        // Resume audio context if suspended (required for autoplay)
        if (ctx.state === "suspended") {
          void ctx.resume().catch(() => {});
        }

        setAudioContext(ctx);
        setFilters(newFilters);
        setIsInitialized(true);
      } catch {
        setInitError(true);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [audioRef, isInitialized, gains]);

  const handleGainChange = (index: number, value: number) => {
    const newGains = [...gains];
    newGains[index] = value;
    setGains(newGains);
    setCurrentPreset("Custom");

    if (filters[index]) {
      filters[index].gain.value = value;
    }

    // Auto-save with debouncing (won't overwrite volume_settings)
    settingsSaverRef.current?.save({ gains: newGains });
  };

  const applyPreset = (presetName: string) => {
    const presetGains = EQ_PRESETS[presetName as keyof typeof EQ_PRESETS];
    if (!presetGains) return;

    setGains(presetGains);
    setCurrentPreset(presetName);

    filters.forEach((filter, index) => {
      filter.gain.value = presetGains[index];
    });

    // Save preset with debouncing (won't overwrite volume_settings)
    settingsSaverRef.current?.save({ gains: presetGains });
  };

  const resetEqualizer = () => {
    applyPreset("Flat");
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex h-10 w-10 items-center justify-center rounded-xl border backdrop-blur-md transition-all duration-200 ${
          isOpen
            ? "border-primary/50 bg-primary/15 text-primary shadow-glow"
            : "border-border bg-accent/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
        } ${initError ? "cursor-not-allowed opacity-50" : ""}`}
        aria-label="Equalizer"
        title={initError ? "Equalizer unavailable" : "Equalizer"}
        disabled={initError}
      >
        <Sliders size={18} className="transition-transform group-hover:rotate-12" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close on click outside */}
          <button
            type="button"
            aria-label="Close equalizer"
            className="fixed inset-0 z-40 cursor-default bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setIsOpen(false);
            }}
            style={{ transform: "translateZ(0)" }}
          />

          {/* Equalizer Panel with glassmorphism */}
          <div className="card-overlay absolute right-0 bottom-full z-50 mb-3 w-[min(520px,90vw)] animate-in p-5 duration-300 slide-in-from-bottom-4">
            {/* Gradient overlay */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-purple-500/10 via-transparent to-blue-500/10" />
            {!isAuthenticated ? (
              <div className="relative px-4 py-8 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-primary/30 bg-linear-to-br from-purple-500/20 to-pink-500/20">
                    <LogIn className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">Login Required</h3>
                <p className="mb-6 text-sm text-muted-foreground">
                  Sign in to save and sync your equalizer settings across devices
                </p>
                <Link href="/auth/login" className="btn btn-primary">
                  <LogIn size={18} />
                  Sign In
                </Link>
              </div>
            ) : initError ? (
              <div className="relative py-8 text-center">
                <p className="mb-2 text-sm text-foreground">Equalizer unavailable</p>
                <p className="text-xs text-muted-foreground">Audio system already initialized</p>
              </div>
            ) : (
              <>
                <div className="relative mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-foreground">Equalizer</h3>
                    <SyncIndicator status={syncStatus} />
                  </div>
                  <button
                    type="button"
                    onClick={resetEqualizer}
                    className="rounded-lg border border-border bg-accent px-3 py-1 text-xs text-primary transition-colors hover:border-primary/30 hover:text-primary/80"
                  >
                    Reset
                  </button>
                </div>

                {/* Presets */}
                <fieldset className="relative m-0 mb-5 border-0 p-0" aria-label="Presets">
                  <legend className="mb-2 block text-xs font-medium text-muted-foreground">
                    Presets
                  </legend>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.keys(EQ_PRESETS).map((presetName) => (
                      <button
                        type="button"
                        key={presetName}
                        onClick={() => applyPreset(presetName)}
                        className={`rounded-lg px-3 py-2 text-xs font-medium backdrop-blur-sm transition-all duration-200 ${
                          currentPreset === presetName
                            ? "border border-primary/60 bg-primary/15 text-primary shadow-glow"
                            : "border border-border bg-accent text-muted-foreground hover:border-border hover:bg-accent/70 hover:text-foreground"
                        }`}
                      >
                        {presetName}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="relative flex h-48 items-end gap-3 overflow-hidden rounded-xl border border-border bg-accent/40 px-3 py-4">
                  {FREQUENCY_BANDS.map((band, index) => (
                    <div
                      key={band.freq}
                      className="group flex min-w-0 flex-1 flex-col items-center gap-2"
                    >
                      <div className="relative mx-auto h-32 w-full max-w-[14px] overflow-hidden rounded-full bg-muted backdrop-blur-sm">
                        {/* Glow effect */}
                        <div
                          className="absolute inset-x-0 bottom-0 rounded-full bg-linear-to-t from-purple-500 via-pink-500 to-blue-500 transition-all duration-200"
                          style={{
                            height: `${((gains[index] + 12) / 24) * 100}%`,
                            opacity: 0.6,
                            filter: "blur(2px)",
                          }}
                        />
                        <input
                          type="range"
                          min="-12"
                          max="12"
                          step="0.5"
                          value={gains[index]}
                          onChange={(e) =>
                            handleGainChange(index, Number.parseFloat(e.target.value))
                          }
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 transition-opacity hover:opacity-100"
                          style={{
                            writingMode: "vertical-lr",
                            WebkitAppearance: "slider-vertical",
                          }}
                          aria-label={`${band.label} gain`}
                        />
                        {/* Visual slider */}
                        <div
                          className="absolute inset-x-0 bottom-0 rounded-full bg-linear-to-t from-purple-400 via-pink-400 to-blue-400 transition-all duration-200"
                          style={{
                            height: `${((gains[index] + 12) / 24) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-medium whitespace-nowrap text-muted-foreground transition-colors group-hover:text-foreground">
                        {band.label}
                      </span>
                      <span className="rounded bg-accent px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground transition-colors group-hover:bg-accent/70">
                        {gains[index] > 0 ? "+" : ""}
                        {gains[index].toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
