"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { NavLink } from "./nav-link";
import type { NavLink as NavLinkType } from "@/lib/constants/navigation";

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
        "md:hidden border-t border-white/5 bg-black/95 backdrop-blur-md transition-all duration-200 overflow-hidden gpu-filter gpu-opacity",
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
