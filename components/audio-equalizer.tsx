"use client";

import { useState, useEffect } from "react";
import { Sliders, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

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

export function AudioEqualizer({
  audioRef,
  className = "",
}: AudioEqualizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [filters, setFilters] = useState<BiquadFilterNode[]>([]);
  const [gains, setGains] = useState<number[]>(
    new Array(FREQUENCY_BANDS.length).fill(0),
  );
  const [currentPreset, setCurrentPreset] = useState<string>("Flat");
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const supabase = createClient();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load saved equalizer settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("equalizer_settings")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .single();

        if (error) {
          console.log("No saved equalizer settings found");
          return;
        }

        if (data && Array.isArray(data.gains)) {
          setGains(data.gains);
          setCurrentPreset(data.preset_name);
          console.log("Loaded equalizer settings:", data.preset_name);
        }
      } catch (error) {
        console.error("Error loading equalizer settings:", error);
      }
    };

    loadSettings();
  }, []);

  // Resume audio context when play is attempted
  useEffect(() => {
    if (!audioContext || !audioRef.current) return;

    const handlePlay = () => {
      if (audioContext.state === "suspended") {
        console.log("Resuming audio context on play...");
        audioContext.resume();
      }
    };

    audioRef.current.addEventListener("play", handlePlay);
    return () => {
      audioRef.current?.removeEventListener("play", handlePlay);
    };
  }, [audioContext, audioRef]);

  // Initialize Web Audio API
  useEffect(() => {
    if (!audioRef.current || isInitialized) return;

    // Wait for audio element to be ready
    const timer = setTimeout(() => {
      if (!audioRef.current) return;

      try {
        console.log("Initializing equalizer...");
        const ctx = new (window.AudioContext ||
          (window as any).webkitAudioContext)();

        let source;
        try {
          source = ctx.createMediaElementSource(audioRef.current);
          console.log("Audio source created successfully");
        } catch (error) {
          console.warn(
            "Cannot create equalizer - audio element already has a source node. Audio will play without EQ:",
            error,
          );
          setInitError(true);
          ctx.close();
          // Don't return - let audio play normally without EQ
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
          ctx.resume().then(() => {
            console.log("Audio context resumed");
          });
        }

        console.log("Equalizer initialized successfully, context state:", ctx.state);
        setAudioContext(ctx);
        setFilters(newFilters);
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize equalizer:", error);
        setInitError(true);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [audioRef.current, isInitialized, gains]);

  const saveSettings = async (newGains: number[], presetName: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setIsSaving(true);

      // Deactivate all existing settings
      await supabase
        .from("equalizer_settings")
        .update({ is_active: false })
        .eq("user_id", user.id);

      // Insert new active settings
      const { error } = await supabase.from("equalizer_settings").insert({
        user_id: user.id,
        preset_name: presetName,
        gains: newGains,
        is_active: true,
      });

      if (error) {
        console.error("Error saving equalizer settings:", error);
      } else {
        console.log("Equalizer settings saved successfully");
      }
    } catch (error) {
      console.error("Error saving equalizer settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGainChange = (index: number, value: number) => {
    const newGains = [...gains];
    newGains[index] = value;
    setGains(newGains);
    setCurrentPreset("Custom");

    if (filters[index]) {
      filters[index].gain.value = value;
    }

    // Auto-save after a short delay
    saveSettings(newGains, "Custom");
  };

  const applyPreset = (presetName: string) => {
    const presetGains = EQ_PRESETS[presetName as keyof typeof EQ_PRESETS];
    if (!presetGains) return;

    setGains(presetGains);
    setCurrentPreset(presetName);

    filters.forEach((filter, index) => {
      filter.gain.value = presetGains[index];
    });

    // Save preset to database
    saveSettings(presetGains, presetName);
  };

  const resetEqualizer = () => {
    applyPreset("Flat");
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 backdrop-blur-md border shadow-lg group ${
          isOpen
            ? "bg-gradient-to-br from-purple-500/30 to-pink-500/20 text-purple-300 border-purple-400/50 shadow-purple-500/30 scale-110"
            : "bg-gradient-to-br from-white/10 to-white/5 border-white/20 text-white/70 hover:text-white hover:border-purple-400/30 hover:shadow-purple-500/20 hover:scale-110"
        } ${initError ? "opacity-50 cursor-not-allowed" : ""}`}
        style={{ transform: "translateZ(0)", willChange: "transform" }}
        aria-label="Equalizer"
        title={initError ? "Equalizer unavailable" : "Equalizer"}
        disabled={initError}
      >
        <Sliders
          size={18}
          className="transition-transform group-hover:rotate-12"
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close on click outside */}
          <div
            className="fixed inset-0 z-40 backdrop-blur-sm bg-black/20"
            onClick={() => setIsOpen(false)}
            style={{ transform: "translateZ(0)" }}
          />

          {/* Equalizer Panel with glassmorphism */}
          <div
            className="absolute bottom-full right-0 mb-3 bg-gradient-to-br from-zinc-900/95 to-black/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-5 shadow-2xl w-[520px] z-50 animate-in slide-in-from-bottom-4 duration-300"
            style={{ transform: "translateZ(0)", willChange: "transform" }}
          >
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 rounded-2xl pointer-events-none" />
            {!isAuthenticated ? (
              <div className="relative text-center py-8 px-4">
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-400/30">
                    <LogIn className="w-8 h-8 text-purple-400" />
                  </div>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  Login Required
                </h3>
                <p className="text-white/60 text-sm mb-6">
                  Sign in to save and sync your equalizer settings across
                  devices
                </p>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-purple-500/50"
                >
                  <LogIn size={18} />
                  Sign In
                </Link>
              </div>
            ) : initError ? (
              <div className="relative text-center py-8">
                <p className="text-white/70 text-sm mb-2">
                  Equalizer unavailable
                </p>
                <p className="text-white/50 text-xs">
                  Audio system already initialized
                </p>
              </div>
            ) : (
              <>
                <div className="relative flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold text-sm drop-shadow-lg">
                      Equalizer
                    </h3>
                    {isSaving && (
                      <span className="text-[10px] text-purple-400 animate-pulse">
                        Saving...
                      </span>
                    )}
                  </div>
                  <button
                    onClick={resetEqualizer}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-all duration-200 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/30"
                  >
                    Reset
                  </button>
                </div>

                {/* Presets */}
                <div className="relative mb-5">
                  <label className="text-xs text-white/50 mb-2 block font-medium">
                    Presets
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.keys(EQ_PRESETS).map((presetName) => (
                      <button
                        key={presetName}
                        onClick={() => applyPreset(presetName)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 backdrop-blur-sm ${
                          currentPreset === presetName
                            ? "bg-gradient-to-br from-purple-500/40 to-pink-500/30 text-purple-200 border border-purple-400/60 shadow-lg shadow-purple-500/30 scale-105"
                            : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10 hover:border-white/20 hover:scale-105"
                        }`}
                        style={{
                          transform: "translateZ(0)",
                          willChange: "transform",
                        }}
                      >
                        {presetName}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative flex items-end gap-3 h-48 px-3 py-4 rounded-xl bg-gradient-to-t from-white/5 to-transparent border border-white/10 overflow-hidden">
                  {FREQUENCY_BANDS.map((band, index) => (
                    <div
                      key={band.freq}
                      className="flex flex-col items-center flex-1 gap-2 group min-w-0"
                    >
                      <div className="relative h-32 w-full max-w-[14px] rounded-full bg-white/10 overflow-hidden backdrop-blur-sm mx-auto">
                        {/* Glow effect */}
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-500 via-pink-500 to-blue-500 transition-all duration-200 rounded-full"
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
                            handleGainChange(index, parseFloat(e.target.value))
                          }
                          className="absolute inset-0 h-full w-full accent-purple-500 cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
                          style={{
                            writingMode: "vertical-lr" as any,
                            WebkitAppearance: "slider-vertical",
                            transform: "translateZ(0)",
                          }}
                          aria-label={`${band.label} gain`}
                        />
                        {/* Visual slider */}
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-400 via-pink-400 to-blue-400 transition-all duration-200 rounded-full"
                          style={{
                            height: `${((gains[index] + 12) / 24) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-white/60 whitespace-nowrap font-medium group-hover:text-white/80 transition-colors">
                        {band.label}
                      </span>
                      <span className="text-[9px] text-white/40 font-mono bg-white/5 px-1.5 py-0.5 rounded group-hover:bg-white/10 transition-colors">
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
