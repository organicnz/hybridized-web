"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import type { Variants } from "framer-motion";

const VARIANTS: Record<string, Variants> = {
  "fade-up": { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } },
  "fade-down": { hidden: { opacity: 0, y: -40 }, visible: { opacity: 1, y: 0 } },
  "fade-left": { hidden: { opacity: 0, x: 40 }, visible: { opacity: 1, x: 0 } },
  "fade-right": { hidden: { opacity: 0, x: -40 }, visible: { opacity: 1, x: 0 } },
  "scale-up": { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } },
  "blur-in": {
    hidden: { opacity: 0, filter: "blur(20px)" },
    visible: { opacity: 1, filter: "blur(0px)" },
  },
};

interface ScrollRevealProps {
  children: React.ReactNode | ((props: { variants: Variants }) => React.ReactNode);
  variant?: "fade-up" | "fade-down" | "fade-left" | "fade-right" | "scale-up" | "blur-in";
  delay?: number;
  duration?: number;
  staggerChildren?: number;
  once?: boolean;
  rootMargin?: string;
  threshold?: number;
  className?: string;
}

export function ScrollReveal({
  children,
  variant = "fade-up",
  delay = 0,
  duration = 600,
  staggerChildren = 0,
  once = true,
  rootMargin = "0px",
  threshold = 0.1,
  className = "",
}: ScrollRevealProps) {
  const containerVariantsSr: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: staggerChildren / 1000, delayChildren: delay / 1000 },
    },
  };
  const itemVariantsSr: Variants = {
    hidden: VARIANTS[variant].hidden,
    visible: {
      ...VARIANTS[variant].visible,
      transition: {
        duration: duration / 1000,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: delay / 1000,
      },
    },
  };

  const [isInView, setIsInView] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsInView(true);
          if (once && observerRef.current) observerRef.current.unobserve(element);
        }
      },
      { rootMargin, threshold },
    );
    observerRef.current = observer;
    observer.observe(element);
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [rootMargin, threshold, once]);

  return (
    <motion.div
      ref={ref}
      variants={containerVariantsSr}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      viewport={{ once, margin: rootMargin }}
      className={className}
    >
      {typeof children === "function" ? (
        children({ variants: itemVariantsSr })
      ) : (
        <motion.div variants={itemVariantsSr}>{children}</motion.div>
      )}
    </motion.div>
  );
}

export function StaggerContainer({
  children,
  stagger = 0.1,
  delayChildren = 0,
  className = "",
}: { children: React.ReactNode; stagger?: number; delayChildren?: number; className?: string }) {
  const intersectionRef = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    const element = intersectionRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) setIsInView(true);
      },
      { threshold: 0.1, rootMargin: "0px" },
    );
    observer.observe(intersectionRef.current!);
    return () => observer.disconnect();
  }, []);
  const containerVariantsSt: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: stagger, delayChildren } },
  };
  return (
    <motion.div
      ref={intersectionRef}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariantsSt}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
  variants,
}: { children: React.ReactNode; className?: string; variants?: Variants }) {
  const defaultVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } },
  };
  return (
    <motion.div className={className} variants={variants || defaultVariants}>
      {children}
    </motion.div>
  );
}
