"use client";

import { cn } from "@/lib/utils";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLinkProps = {
  href: Route;
  label: string;
  highlight?: boolean;
  variant?: "desktop" | "mobile";
  onClick?: () => void;
};

export function NavLink({ href, label, highlight, variant = "desktop", onClick }: NavLinkProps) {
  const pathname = usePathname();
  // Check if we're on the exact page or within the section (e.g., /home or /home/*)
  const isActive = pathname === href || (href === "/home" && pathname.startsWith("/home"));

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Prevent navigation if already on this page
    if (isActive) {
      e.preventDefault();
      return;
    }
    onClick?.();
  };

  if (variant === "mobile") {
    return (
      <Link
        href={href}
        onClick={handleClick}
        className={cn(
          "block rounded-xl border border-transparent px-4 py-2.5 font-medium transition-all duration-200",
          isActive && "cursor-default border-border bg-accent text-accent-foreground",
          !isActive &&
            (highlight
              ? "text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"),
        )}
        aria-current={isActive ? "page" : undefined}
        aria-disabled={isActive}
      >
        {label}
      </Link>
    );
  }

  if (highlight) {
    return (
      <Link
        href={href}
        onClick={handleClick}
        className={cn(
          "inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-semibold text-emerald-500 transition-all duration-200 hover:border-emerald-500/50 hover:bg-emerald-500/15 hover:text-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]",
          isActive && "cursor-default border-emerald-500/60 bg-emerald-500/20",
        )}
        aria-current={isActive ? "page" : undefined}
        aria-disabled={isActive}
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        "group relative font-display text-sm font-semibold tracking-wide transition-colors",
        isActive ? "cursor-default text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
      aria-current={isActive ? "page" : undefined}
      aria-disabled={isActive}
    >
      {label}
      <span
        className={cn(
          "absolute -bottom-1.5 left-0 h-0.5 rounded-full bg-linear-to-r from-purple-500 via-pink-500 to-blue-500 transition-all duration-300",
          isActive ? "w-full" : "w-0 group-hover:w-full",
        )}
      />
    </Link>
  );
}
