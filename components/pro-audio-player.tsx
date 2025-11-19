'use client'

import { useRef, useEffect, useState } from 'react'
import { useAudioWorklet } from '@/hooks/use-audio-worklet'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { Play, Pause, Sliders, Radio, Eye, EyeOff } from 'lucide-react'
import { EQ_PRESETS, SPATIAL_PRESETS } from '@/lib/audio-presets'
import { AudioVisualizer } from './audio-visualizer'
import { AudioProgressBar } from './audio-progress-bar'
import { AudioControlsPanel } from './audio-controls-panel'

interface ProAudioPlayerProps {
  src: string
  title?: string
  enableEQ?: boolean
  enableSpatial?: boolean
  enableCompression?: boolean
}

export function ProAudioPlayer({ 
  src, 
  title,
  enableEQ = true,
  enableSpatial = true,
  enableCompression = true 
}: ProAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [showEQ, setShowEQ] = useState(false)
  const [showSpatial, setShowSpatial] = useState(false)
  const [showVisualizer, setShowVisualizer] = useState(true)
  
  const [eqBands, setEqBands] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  const [spatialX, setSpatialX] = useState(0)
  const [spatialY, setSpatialY] = useState(0)
  const [spatialZ, setSpatialZ] = useState(-1)
  const [selectedEQPreset, setSelectedEQPreset] = useState('Flat')
  const [selectedSpatialPreset, setSelectedSpatialPreset] = useState('Center')

  const {
    initializeAdvancedAudio,
    setEQBand,
    setSpatialPosition,
    setCompression,
    resume,
    isReady,
    analyser,
    hasEqualizer,
    hasSpatialAudio,
    hasCompression
  } = useAudioWorklet({
    enableEqualizer: enableEQ,
    enableSpatialAudio: enableSpatial,
    enableDynamicCompression: enableCompression
  })

  useEffect(() => {
    if (audioRef.current && !isReady) {
      // Initialize on user interaction to comply with browser autoplay policies
      const handleInteraction = () => {
        if (audioRef.current) {
          initializeAdvancedAudio(audioRef.current)
        }
      }
      
      // Initialize immediately if possible, or wait for user interaction
      handleInteraction()
    }
  }, [initializeAdvancedAudio, isReady])

  useEffect(() => {
    if (hasCompression) {
      setCompression(-24, 12)
    }
  }, [hasCompression, setCompression])

  const togglePlay = async () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      await resume()
      await audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const adjustVolume = (delta: number) => {
    const newVolume = Math.max(0, Math.min(1, volume + delta))
    setVolume(newVolume)
    if (audioRef.current) audioRef.current.volume = newVolume
  }

  const skip = (seconds: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + seconds)
  }

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onPlayPause: togglePlay,
    onVolumeUp: () => adjustVolume(0.1),
    onVolumeDown: () => adjustVolume(-0.1),
    onMute: () => {
      if (audioRef.current) {
        audioRef.current.muted = !audioRef.current.muted
      }
    },
    onSkipForward: () => skip(10),
    onSkipBackward: () => skip(-10),
    onToggleEQ: () => setShowEQ(!showEQ),
    onToggleSpatial: () => setShowSpatial(!showSpatial),
    onToggleVisualizer: () => setShowVisualizer(!showVisualizer),
  })

  const handleEQChange = (bandIndex: number, value: number) => {
    const newBands = [...eqBands]
    newBands[bandIndex] = value
    setEqBands(newBands)
    setEQBand(bandIndex, value)
    setSelectedEQPreset('Custom')
  }

  const applyEQPreset = (presetName: string) => {
    const preset = EQ_PRESETS.find(p => p.name === presetName)
    if (preset) {
      setEqBands(preset.bands)
      preset.bands.forEach((gain, index) => setEQBand(index, gain))
      setSelectedEQPreset(presetName)
    }
  }

  const applySpatialPreset = (presetName: string) => {
    const preset = SPATIAL_PRESETS.find(p => p.name === presetName)
    if (preset) {
      setSpatialX(preset.position.x)
      setSpatialY(preset.position.y)
      setSpatialZ(preset.position.z)
      setSelectedSpatialPreset(presetName)
    }
  }

  const handleSpatialChange = () => {
    setSpatialPosition(spatialX, spatialY, spatialZ)
  }

  useEffect(() => {
    if (hasSpatialAudio) {
      handleSpatialChange()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spatialX, spatialY, spatialZ, hasSpatialAudio])

  const eqFrequencies = ['32', '64', '125', '250', '500', '1K', '2K', '4K', '8K', '16K']

  return (
    <div className="bg-gradient-to-br from-purple-900/30 via-black/50 to-blue-900/30 backdrop-blur-md border border-white/20 rounded-xl p-6">
      {title && (
        <h3 className="text-white font-bold mb-4 text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          {title}
        </h3>
      )}

      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        crossOrigin="anonymous"
        onVolumeChange={(e) => setVolume((e.target as HTMLAudioElement).volume)}
      />

      {/* Progress Bar */}
      <AudioProgressBar audioRef={audioRef} className="mb-4" />

      {/* Main Controls */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={togglePlay}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white p-3 rounded-full transition-all hover:scale-110 shadow-lg flex-shrink-0"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>

        <AudioControlsPanel
          audioRef={audioRef}
          volume={volume}
          onVolumeChange={(vol) => {
            setVolume(vol)
            if (audioRef.current) audioRef.current.volume = vol
          }}
          className="flex-1"
        />
      </div>

      {isReady && (
        <div className="space-y-3">
          {/* Visualizer */}
          {showVisualizer && (
            <AudioVisualizer
              analyser={analyser}
              isPlaying={isPlaying}
            />
          )}

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowVisualizer(!showVisualizer)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                showVisualizer 
                  ? 'bg-green-500/30 text-white border border-green-400/50' 
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {showVisualizer ? <Eye size={16} /> : <EyeOff size={16} />}
              <span className="text-sm">Visualizer</span>
            </button>

            {hasEqualizer && (
              <button
                onClick={() => setShowEQ(!showEQ)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  showEQ 
                    ? 'bg-purple-500/30 text-white border border-purple-400/50' 
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                <Sliders size={16} />
                <span className="text-sm">EQ</span>
              </button>
            )}

            {hasSpatialAudio && (
              <button
                onClick={() => setShowSpatial(!showSpatial)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  showSpatial 
                    ? 'bg-blue-500/30 text-white border border-blue-400/50' 
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                <Radio size={16} />
                <span className="text-sm">3D Audio</span>
              </button>
            )}
          </div>

          {showEQ && hasEqualizer && (
            <div className="bg-black/30 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white/90 text-sm font-semibold">10-Band Equalizer</h4>
                <select
                  value={selectedEQPreset}
                  onChange={(e) => applyEQPreset(e.target.value)}
                  className="bg-white/10 text-white text-xs px-2 py-1 rounded border border-white/20"
                >
                  {EQ_PRESETS.map(preset => (
                    <option key={preset.name} value={preset.name}>{preset.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 items-end justify-between">
                {eqBands.map((gain, index) => (
                  <div key={index} className="flex flex-col items-center gap-2">
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="0.5"
                      value={gain}
                      onChange={(e) => handleEQChange(index, parseFloat(e.target.value))}
                      className="h-24 accent-purple-500"
                      style={{ writingMode: 'bt-lr', appearance: 'slider-vertical' }}
                    />
                    <span className="text-xs text-white/60">{eqFrequencies[index]}</span>
                    <span className="text-xs text-white/40">{gain > 0 ? '+' : ''}{gain.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showSpatial && hasSpatialAudio && (
            <div className="bg-black/30 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-white/90 text-sm font-semibold">3D Spatial Audio</h4>
                <select
                  value={selectedSpatialPreset}
                  onChange={(e) => applySpatialPreset(e.target.value)}
                  className="bg-white/10 text-white text-xs px-2 py-1 rounded border border-white/20"
                >
                  {SPATIAL_PRESETS.map(preset => (
                    <option key={preset.name} value={preset.name}>{preset.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-white/60 block mb-1">Left/Right (X)</label>
                  <input
                    type="range"
                    min="-5"
                    max="5"
                    step="0.1"
                    value={spatialX}
                    onChange={(e) => setSpatialX(parseFloat(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <span className="text-xs text-white/40">{spatialX.toFixed(1)}</span>
                </div>
                <div>
                  <label className="text-xs text-white/60 block mb-1">Up/Down (Y)</label>
                  <input
                    type="range"
                    min="-5"
                    max="5"
                    step="0.1"
                    value={spatialY}
                    onChange={(e) => setSpatialY(parseFloat(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <span className="text-xs text-white/40">{spatialY.toFixed(1)}</span>
                </div>
                <div>
                  <label className="text-xs text-white/60 block mb-1">Front/Back (Z)</label>
                  <input
                    type="range"
                    min="-5"
                    max="5"
                    step="0.1"
                    value={spatialZ}
                    onChange={(e) => setSpatialZ(parseFloat(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <span className="text-xs text-white/40">{spatialZ.toFixed(1)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 text-xs">
            {hasCompression && (
              <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded border border-green-500/30">
                Dynamic Compression
              </span>
            )}
            {hasEqualizer && (
              <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded border border-purple-500/30">
                10-Band EQ
              </span>
            )}
            {hasSpatialAudio && (
              <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded border border-blue-500/30">
                HRTF 3D Audio
              </span>
            )}
            <span className="bg-white/10 text-white/60 px-2 py-1 rounded">
              48kHz Hardware Accelerated
            </span>
          </div>

          {/* Keyboard Shortcuts Help */}
          <details className="mt-3">
            <summary className="text-xs text-white/50 cursor-pointer hover:text-white/70 transition-colors">
              Keyboard Shortcuts
            </summary>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="text-white/50">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono">Space</kbd> / <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono">K</kbd> Play/Pause
              </div>
              <div className="text-white/50">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono">↑</kbd> / <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono">↓</kbd> Volume
              </div>
              <div className="text-white/50">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono">M</kbd> Mute
              </div>
              <div className="text-white/50">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono">Shift</kbd> + <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono">←</kbd> / <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono">→</kbd> Skip
              </div>
              <div className="text-white/50">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono">E</kbd> Toggle EQ
              </div>
              <div className="text-white/50">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono">S</kbd> Toggle Spatial
              </div>
              <div className="text-white/50">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono">V</kbd> Toggle Visualizer
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  )
}
