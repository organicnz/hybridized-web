"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
  onEnter?: () => void;
  onExit?: () => void;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): [RefObject<HTMLElement | null>, boolean] {
  const {
    threshold = 0.1,
    rootMargin = "0px",
    triggerOnce = true,
    onEnter,
    onExit,
  } = options;

  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsVisible(true);
          onEnter?.();
          if (triggerOnce && observerRef.current) {
            observerRef.current.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
          onExit?.();
        }
      },
      { threshold, rootMargin }
    );

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin, triggerOnce, onEnter, onExit]);

  return [ref, isVisible];
}

export function useScrollDirection(): "up" | "down" | null {
  const [direction, setDirection] = useState<"up" | "down" | null>(null);
  const lastY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY > lastY.current) {
        setDirection("down");
      } else if (currentY < lastY.current) {
        setDirection("up");
      }
      lastY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return direction;
}

export function useParallax(speed = 0.5): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.scrollY * speed);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return offset;
}