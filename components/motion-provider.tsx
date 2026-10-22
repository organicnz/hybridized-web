"use client";

import { domAnimation } from "@/lib/motion";
import { LazyMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * The provider for the page's animations.
 *
 * The features are framer-motion's animation engine. The app uses the mini
 * renderer — the ordinary animations, without layout animations or gestures —
 * and the full renderer was a hundred and ten kilobytes of the JavaScript
 * every page downloads.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
