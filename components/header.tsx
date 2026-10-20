"use client";

import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { HEADER_STYLES, NAV_LINKS } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";
import { Menu, Moon, Sun, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { MobileMenu } from "./mobile-menu";
import { NavLink } from "./nav-link";
import { SearchBar } from "./search-bar";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { profile } = useProfile();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const cycleTheme = () => {
    const themes: ("light" | "dark" | "system")[] = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  const getThemeIcon = () => {
    switch (resolvedTheme) {
      case "light":
        return <Sun className={HEADER_STYLES.icon} />;
      case "dark":
        return <Moon className={HEADER_STYLES.icon} />;
      default:
        return <Moon className={HEADER_STYLES.icon} />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case "light":
        return "Switch to dark mode";
      case "dark":
        return "Switch to system theme";
      case "system":
        return "Switch to light mode";
    }
  };

  return (
    <header className="surface-shell gpu-filter sticky top-0 z-50 border-b shadow-header">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3.5 md:px-8">
        {/* Logo */}
        <Link href="/" className="group flex shrink-0 items-center gap-3">
          <span className="relative">
            <Image
              src="/logo.png"
              alt="Hybridized Logo"
              title="Hybridized - Home"
              width={40}
              height={40}
              className="gpu h-10 w-10 rounded-xl ring-1 ring-border transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3 md:h-11 md:w-11"
              priority
            />
            <span
              className="pointer-events-none absolute inset-0 rounded-xl bg-linear-to-t from-purple-500/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              aria-hidden="true"
            />
          </span>
          <span className="gradient-text font-display text-xl font-bold tracking-tight md:text-2xl">
            Hybridized
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} {...link} variant="desktop" />
          ))}
        </nav>

        {/* Search, Theme Toggle & User */}
        <div className="flex items-center gap-2 md:gap-3">
          <SearchBar />

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={cycleTheme}
            className={cn(HEADER_STYLES.button, "relative overflow-visible")}
            aria-label={getThemeLabel()}
            title={getThemeLabel()}
          >
            <span className="transition-transform duration-fast ease-out">{getThemeIcon()}</span>
          </button>

          <Link
            href={user ? "/profile" : "/auth/login"}
            className={cn(
              HEADER_STYLES.button,
              user && profile?.avatar_url && "overflow-hidden p-0",
            )}
            aria-label={user ? "Profile" : "Sign in"}
            title={user ? "Profile" : "Sign in"}
          >
            {user && profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="Profile"
                width={40}
                height={40}
                className="h-10 w-10 object-cover"
                key={profile.avatar_url}
                unoptimized
              />
            ) : (
              <User className={HEADER_STYLES.icon} />
            )}
          </Link>

          <button
            type="button"
            onClick={toggleMobileMenu}
            className={cn("md:hidden", HEADER_STYLES.button)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className={HEADER_STYLES.icon} />
          </button>
        </div>
      </div>

      <MobileMenu isOpen={mobileMenuOpen} onClose={closeMobileMenu} navLinks={NAV_LINKS} />
    </header>
  );
}
