"use client";

import {
  type AudioEnhancementSettings,
  DEFAULT_AUDIO_SETTINGS,
  getAudioEnhancer,
} from "@/lib/audio/enhancer";
import { useEffect, useRef, useState } from "react";

/**
 * Hook to enhance audio quality using Web Audio API
 */
export function useAudioEnhancement() {
  const enhancerRef = useRef(getAudioEnhancer());
  const [settings, setSettings] = useState<AudioEnhancementSettings>(DEFAULT_AUDIO_SETTINGS);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    const enhancer = enhancerRef.current;

    // Enable hardware acceleration
    enhancer.enableHardwareAcceleration();

    // Apply settings
    if (isEnabled) {
      enhancer.applySettings(settings);
    }

    return () => {
      // Cleanup on unmount
      enhancer.disconnect();
    };
  }, [settings, isEnabled]);

  /**
   * Connect an iframe's audio to the enhancer
   */
  const enhanceIframe = (iframe: HTMLIFrameElement) => {
    try {
      // Try to access iframe's audio elements
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;

      const audioElements = iframeDoc.querySelectorAll("audio, video");
      for (const element of audioElements) {
        if (element instanceof HTMLMediaElement) {
          enhancerRef.current.connectAudio(element);
        }
      }
    } catch {
      // Cross-origin iframes can't be accessed
      console.log("Cannot enhance cross-origin iframe audio");
    }
  };

  /**
   * Update enhancement settings
   */
  const updateSettings = (newSettings: Partial<AudioEnhancementSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  /**
   * Toggle enhancement on/off
   */
  const toggleEnhancement = () => {
    setIsEnabled((prev) => !prev);
  };

  return {
    settings,
    updateSettings,
    isEnabled,
    toggleEnhancement,
    enhanceIframe,
  };
}
