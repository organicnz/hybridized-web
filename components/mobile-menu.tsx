"use client";

import type { NavLink as NavLinkType } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { NavLink } from "./nav-link";

type MobileMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  navLinks: readonly NavLinkType[];
};

export function MobileMenu({ isOpen, onClose, navLinks }: MobileMenuProps) {
  // Close on Escape & prevent body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.nav
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className={cn(
            "surface-shell gpu-filter overflow-hidden border-t shadow-header md:hidden",
          )}
          aria-label="Mobile navigation"
        >
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
            }}
            className="space-y-1 px-4 py-3"
          >
            {navLinks.map((link) => (
              <motion.div
                key={link.href}
                variants={{
                  hidden: { opacity: 0, x: -12 },
                  visible: { opacity: 1, x: 0 },
                }}
              >
                <NavLink
                  href={link.href}
                  label={link.label}
                  highlight={link.highlight}
                  variant="mobile"
                  onClick={onClose}
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
