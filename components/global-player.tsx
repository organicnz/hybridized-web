"use client";

import { usePlayer } from "@/lib/player-context";
import { PersistentPlayer } from "./persistent-player";

export function GlobalPlayer() {
  const { currentTrack, setCurrentTrack } = usePlayer();

  return (
    <PersistentPlayer
      currentTrack={currentTrack}
      onClose={() => setCurrentTrack(null)}
    />
  );
}
