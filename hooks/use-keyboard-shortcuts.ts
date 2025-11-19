"use client";

import { useEffect, useCallback } from "react";

interface KeyboardShortcutsConfig {
  onPlayPause?: () => void;
  onVolumeUp?: () => void;
  onVolumeDown?: () => void;
  onMute?: () => void;
  onSkipForward?: () => void;
  onSkipBackward?: () => void;
  onToggleEQ?: () => void;
  onToggleSpatial?: () => void;
  onToggleVisualizer?: () => void;
}

export function useKeyboardShortcuts(config: KeyboardShortcutsConfig) {
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          config.onPlayPause?.();
          break;

        case "arrowup":
          e.preventDefault();
          config.onVolumeUp?.();
          break;

        case "arrowdown":
          e.preventDefault();
          config.onVolumeDown?.();
          break;

        case "m":
          e.preventDefault();
          config.onMute?.();
          break;

        case "arrowright":
          if (e.shiftKey) {
            e.preventDefault();
            config.onSkipForward?.();
          }
          break;

        case "arrowleft":
          if (e.shiftKey) {
            e.preventDefault();
            config.onSkipBackward?.();
          }
          break;

        case "e":
          e.preventDefault();
          config.onToggleEQ?.();
          break;

        case "s":
          e.preventDefault();
          config.onToggleSpatial?.();
          break;

        case "v":
          e.preventDefault();
          config.onToggleVisualizer?.();
          break;
      }
    },
    [config],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);
}
