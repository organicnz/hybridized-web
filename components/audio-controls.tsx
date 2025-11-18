"use client";

import { useState } from 'react';
import { Volume2, VolumeX, Settings } from 'lucide-react';
import type { AudioEnhancementSettings } from '@/lib/audio/enhancer';

interface AudioControlsProps {
  settings: AudioEnhancementSettings;
  isEnabled: boolean;
  onSettingsChange: (settings: Partial<AudioEnhancementSettings>) => void;
  onToggle: () => void;
}

export function AudioControls({ settings, isEnabled, onSettingsChange, onToggle }: AudioControlsProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute bottom-16 right-0 bg-[#282828] rounded-lg p-4 shadow-2xl border border-white/10 w-72 mb-2">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Audio Enhancement
          </h3>
          
          <div className="space-y-4">
            {/* Bass Boost */}
            <div>
              <label className="text-sm text-white/70 block mb-2">
                Bass Boost: {settings.bassBoost}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.bassBoost}
                onChange={(e) => onSettingsChange({ bassBoost: Number(e.target.value) })}
                className="w-full accent-[#1DB954]"
              />
            </div>

            {/* Treble Boost */}
            <div>
              <label className="text-sm text-white/70 block mb-2">
                Treble Boost: {settings.trebleBoost}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.trebleBoost}
                onChange={(e) => onSettingsChange({ trebleBoost: Number(e.target.value) })}
                className="w-full accent-[#1DB954]"
              />
            </div>

            {/* Compression */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.compression}
                onChange={(e) => onSettingsChange({ compression: e.target.checked })}
                className="w-4 h-4 accent-[#1DB954]"
              />
              <span className="text-sm text-white/70">Dynamic Compression</span>
            </label>

            {/* Normalize */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.normalize}
                onChange={(e) => onSettingsChange({ normalize: e.target.checked })}
                className="w-4 h-4 accent-[#1DB954]"
              />
              <span className="text-sm text-white/70">Volume Normalization</span>
            </label>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-white/40">
              🎵 Hardware-accelerated audio processing
            </p>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-12 h-12 rounded-full bg-[#1DB954] hover:bg-[#1ed760] flex items-center justify-center transition-colors shadow-lg"
          aria-label="Audio settings"
        >
          <Settings className="w-5 h-5 text-black" />
        </button>

        <button
          onClick={onToggle}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg ${
            isEnabled 
              ? 'bg-[#1DB954] hover:bg-[#1ed760]' 
              : 'bg-white/10 hover:bg-white/20'
          }`}
          aria-label={isEnabled ? 'Disable enhancement' : 'Enable enhancement'}
        >
          {isEnabled ? (
            <Volume2 className="w-5 h-5 text-black" />
          ) : (
            <VolumeX className="w-5 h-5 text-white" />
          )}
        </button>
      </div>
    </div>
  );
}
