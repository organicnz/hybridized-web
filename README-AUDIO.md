# Hardware-Accelerated Audio System

Professional-grade audio processing system leveraging browser hardware acceleration for optimal music quality.

## Features

### 🎛️ 10-Band Parametric Equalizer

- Frequencies: 32Hz, 64Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz
- ±12dB gain range per band
- 10 presets: Flat, Bass Boost, Treble Boost, Vocal, V-Shape, Classical, Rock, Electronic, Jazz, Podcast

### 🎧 3D Spatial Audio

- HRTF (Head-Related Transfer Function) panning
- X/Y/Z axis positioning
- 6 spatial presets: Center, Wide, Concert Hall, Intimate, Left Stage, Right Stage

### 🔊 Dynamic Range Compression

- Industry-standard mastering settings
- Consistent volume levels
- Prevents clipping and distortion

### 📊 Real-Time Visualizers

- Frequency bars with gradient colors
- Waveform oscilloscope
- Circular spectrum analyzer
- Smooth 60fps animations

### 🎮 Advanced Controls

- Seekable progress bar with time display
- Volume control with visual feedback
- Skip forward/backward (10 seconds)
- Loop toggle
- Playback speed control (0.5x - 2x)
- Mute toggle

### ⌨️ Keyboard Shortcuts

- `Space` / `K` - Play/Pause
- `↑` / `↓` - Volume up/down
- `M` - Mute/Unmute
- `Shift + ←` / `→` - Skip backward/forward
- `E` - Toggle EQ
- `S` - Toggle Spatial Audio
- `V` - Toggle Visualizer

### ⚡ Hardware Acceleration

- 48kHz sample rate
- Web Audio API with AudioContext
- Optimized audio graph processing
- Low-latency playback

## Usage

```tsx
import { ProAudioPlayer } from "@/components/pro-audio-player";

<ProAudioPlayer
  src="https://example.com/audio.mp3"
  title="Track Name"
  enableEQ={true}
  enableSpatial={true}
  enableCompression={true}
/>;
```

## Technical Implementation

### Audio Graph Architecture

```
Source → Compressor → EQ Filters → Panner → Destination
```

### Best Practices Applied

1. **Smooth Parameter Changes**: Uses `setValueAtTime()` to prevent audio artifacts
2. **Browser Compatibility**: Supports both `AudioContext` and `webkitAudioContext`
3. **Resource Cleanup**: Proper cleanup of audio contexts on unmount
4. **Error Handling**: Graceful fallbacks for unsupported features
5. **Performance**: Canvas rendering with `alpha: false` for better performance
6. **Memory Management**: Proper disposal of audio nodes and contexts

### Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (with webkit prefix)
- Mobile browsers: Full support

## Demo

Visit `/audio-demo` to test the full-featured audio player with all controls.

## API Reference

### useAudioWorklet Hook

```tsx
const {
  initializeAdvancedAudio,
  setEQBand,
  setSpatialPosition,
  setCompression,
  resume,
  cleanup,
  isReady,
} = useAudioWorklet({
  enableEqualizer: true,
  enableSpatialAudio: true,
  enableDynamicCompression: true,
});
```

### Audio Utilities

```tsx
import {
  isWebAudioSupported,
  getOptimalSampleRate,
  supportsHRTF,
  dbToGain,
  gainToDb,
} from "@/lib/audio-utils";
```
