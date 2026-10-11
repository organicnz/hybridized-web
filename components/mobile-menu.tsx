"use client";

import type { NavLink as NavLinkType } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";
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
    <nav
      className={cn(
        "md:hidden border-t border-white/10 bg-black/70 backdrop-blur-2xl shadow-[0_20px_40px_-12px_rgba(124,58,237,0.12)] transition-all duration-300 overflow-hidden gpu-filter gpu-opacity",
        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
      )}
      aria-label="Mobile navigation"
      aria-hidden={!isOpen}
    >
      <div className="px-4 py-2 space-y-1">
        {navLinks.map((link) => (
          <NavLink
            key={link.href}
            href={link.href}
            label={link.label}
            highlight={link.highlight}
            variant="mobile"
            onClick={onClose}
          />
        ))}
      </div>
    </nav>
  );
}
