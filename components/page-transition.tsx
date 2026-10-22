"use client";

import { AnimatePresence, m } from "@/lib/motion";
import type { ReactNode } from "react";

const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 1.02 },
};

const pageTransition = {
  type: "spring",
  stiffness: 260,
  damping: 20,
  mass: 0.8,
};

export function PageTransition({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence mode="wait">
      <m.div
        className={className}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={pageTransition}
        style={{ position: "relative", width: "100%" }}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}

// Shared variants for staggered animations
export const staggerItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export function StaggerContainer({
  children,
  className = "",
  stagger = 0.06,
  delayChildren = 0.1,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delayChildren?: number;
}) {
  return (
    <m.div
      className={className}
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      custom={{ stagger, delayChildren }}
    >
      {children}
    </m.div>
  );
}

export function StaggerItem({
  children,
  className = "",
  custom,
  variants = staggerItemVariants,
}: {
  children: ReactNode;
  className?: string;
  custom?: number;
  variants?: typeof staggerItemVariants;
}) {
  return (
    <m.div className={className} variants={variants} custom={custom}>
      {children}
    </m.div>
  );
}

export function FadeInUp({
  children,
  className = "",
  delay = 0,
  duration = 0.6,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </m.div>
  );
}

export function ScaleIn({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: [0.34, 1.56, 0.64, 1] }}
    >
      {children}
    </m.div>
  );
}

export function SlideInFromLeft({
  children,
  className = "",
  delay = 0,
  distance = 40,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
}) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, x: -distance }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </m.div>
  );
}

export function SlideInFromRight({
  children,
  className = "",
  delay = 0,
  distance = 40,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
}) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, x: distance }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </m.div>
  );
}

export function useReducedMotion() {
  if (typeof window === "undefined") return false;
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  return mediaQuery.matches;
}

export function MotionConfigWrapper({ children }: { children: ReactNode }) {
  return <m.div style={{ willChange: "transform, opacity" }}>{children}</m.div>;
}

export { m, AnimatePresence } from "@/lib/motion";
