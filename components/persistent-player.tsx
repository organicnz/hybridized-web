"use client";

import type { Database } from "@/lib/types/database.types";

type Band = Database["public"]["Tables"]["bands"]["Row"];

interface PersistentPlayerProps {
  currentTrack: Band | null;
  onClose: () => void;
}

export function PersistentPlayer({
  currentTrack,
  onClose,
}: PersistentPlayerProps) {
  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#181818] border-t border-white/10 p-4 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-white font-medium">{currentTrack.name}</h3>
            <p className="text-white/60 text-sm">{currentTrack.description}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
