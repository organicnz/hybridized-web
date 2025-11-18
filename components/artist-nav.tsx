"use client";

import { useState } from "react";

const artists = [
  "Hybrid",
  "Alex Hall",
  "Deepsky",
  "Benz & MD",
  "Burufunk",
  "Digital Witchcraft",
  "DjKIRA",
  "Grayarea",
  "J-Slyde",
  "James Warren",
  "Jason Dunne",
  "KiloWatts",
  "Micah",
  "Nick Lewis",
  "Noel Sanger",
  "NuBreed"
];

export function ArtistNav() {
  const [active, setActive] = useState("Hybrid");

  return (
    <nav className="bg-[#4A5568] border-b border-black/10">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-0 min-w-max px-6">
          {artists.map((artist) => (
            <button
              key={artist}
              onClick={() => setActive(artist)}
              className={`
                px-6 py-3 text-white font-medium whitespace-nowrap transition-colors
                hover:bg-white/5 relative
                ${active === artist ? "text-white" : "text-white/70"}
              `}
            >
              {artist}
              {active === artist && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4FD1C5]" />
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
