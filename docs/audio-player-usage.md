# Audio Player Usage Guide

## How to Play Tracks

The audio player now has two modes:

### 1. Play Immediately (User Action)

Use `playTrack()` or `playPlaylist()` when the user clicks a play button:

```tsx
"use client";
import { useAudioPlayer } from "@/lib/audio-player-context";

export function TrackList() {
  const { playTrack, playPlaylist } = useAudioPlayer();

  const handlePlaySingleTrack = () => {
    playTrack({
      id: "1",
      title: "Song Name",
      artist: "Artist Name",
      audioUrl: "https://example.com/song.mp3",
      coverUrl: "https://example.com/cover.jpg",
    });
  };

  const handlePlayPlaylist = () => {
    const tracks = [
      { id: "1", title: "Song 1", artist: "Artist", audioUrl: "url1.mp3" },
      { id: "2", title: "Song 2", artist: "Artist", audioUrl: "url2.mp3" },
    ];
    playPlaylist(tracks, 0); // Start at index 0
  };

  return (
    <div>
      <button onClick={handlePlaySingleTrack}>Play Track</button>
      <button onClick={handlePlayPlaylist}>Play Playlist</button>
    </div>
  );
}
```

### 2. Set Without Playing (Programmatic)

Use `setCurrentTrack()` or `setPlaylist()` to queue without playing:

```tsx
const { setCurrentTrack, setPlaylist } = useAudioPlayer();

// Queue a track without playing
setCurrentTrack(track);

// Queue a playlist without playing
setPlaylist(tracks, 0);
```

## Behavior

- **User clicks play**: Track plays immediately using `playTrack()` or `playPlaylist()`
- **Page refresh**: Player restores with track paused at exact position
- **Navigation**: Player continues playing without interruption
- **Audio caching**: Songs are cached after first play for instant loading

## Available Methods

```tsx
const {
  // State
  currentTrack, // Currently loaded track
  playlist, // Current playlist
  currentIndex, // Current track index in playlist
  isPlaying, // Whether audio is playing
  currentTime, // Current playback position in seconds
  shouldAutoPlay, // Whether to autoplay (internal)

  // Play immediately (user actions)
  playTrack, // Play a single track now
  playPlaylist, // Play a playlist now
  playNext, // Skip to next track
  playPrevious, // Go to previous track

  // Set without playing (programmatic)
  setCurrentTrack, // Queue track without playing
  setPlaylist, // Queue playlist without playing

  // Manual controls
  setIsPlaying, // Update playing state
  setCurrentTime, // Update playback position
} = useAudioPlayer();
```
