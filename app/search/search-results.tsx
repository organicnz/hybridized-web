"use client";

import { Music } from "lucide-react";
import Image from "next/image";

type Hybrid = {
  id: number;
  name: string;
  description: string;
  formula: string;
  cover_url?: string;
  iframe_url?: string;
};

export function SearchResults({
  results,
  query,
}: {
  results: Hybrid[];
  query: string;
}) {
  if (results.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 text-center">
        <Music className="w-16 h-16 text-white/20 mx-auto mb-4" />
        <p className="text-white/60 text-lg">No results found for "{query}"</p>
        <p className="text-white/40 text-sm mt-2">
          Try a different search term
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-white/60 mb-4">
        Found {results.length} {results.length === 1 ? "result" : "results"}
      </p>

      <div className="grid gap-6">
        {results.map((hybrid) => (
          <div
            key={hybrid.id}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-colors"
          >
            <div className="flex gap-6">
              {hybrid.cover_url && (
                <div className="flex-shrink-0">
                  <Image
                    src={hybrid.cover_url}
                    alt={hybrid.name}
                    width={120}
                    height={120}
                    className="rounded-lg object-cover"
                  />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {hybrid.name}
                </h3>

                {hybrid.formula && (
                  <p className="text-purple-400 font-mono text-sm mb-3">
                    {hybrid.formula}
                  </p>
                )}

                {hybrid.description && (
                  <p className="text-white/70 mb-4">{hybrid.description}</p>
                )}

                {hybrid.iframe_url && (
                  <div className="mt-4">
                    <iframe
                      src={hybrid.iframe_url}
                      width="100%"
                      height="152"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
