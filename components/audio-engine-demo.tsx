"use client";

import { EnhancedAudioPlayer } from "@/components/enhanced-audio-player";
import { createDemoTrackUrl } from "@/lib/audio/demo-track";
import { useEffect, useState } from "react";

/**
 * Audio engine demo host. Synthesises a seamless music loop in the browser so
 * the page is self-contained and the analyser always has signal to visualise.
 */
export function AudioEngineDemo() {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const url = createDemoTrackUrl();
    setSrc(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, []);

  if (!src) {
    return (
      <div
        className="h-24 w-full animate-pulse rounded-lg border border-white/10 bg-white/5"
        aria-hidden="true"
      />
    );
  }

  return <EnhancedAudioPlayer src={src} title="Hybridized Audio Engine Demo" loop />;
}
