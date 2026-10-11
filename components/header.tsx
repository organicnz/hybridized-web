"use client";

import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useTheme } from "@/components/theme-provider";
import { HEADER_STYLES, NAV_LINKS } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";
import { Menu, User, Sun, Moon } from "lucide-react";
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
    <header className="bg-black/70 border-b border-white/10 sticky top-0 z-50 backdrop-blur-2xl gpu-filter shadow-[0_1px_0_0_rgba(255,255,255,0.05),0_8px_32px_-8px_rgba(124,58,237,0.15)]">
      <div className="px-4 md:px-10 py-3.5 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
          <Image
            src="/logo.png"
            alt="Hybridized Logo"
            title="Hybridized - Home"
            width={40}
            height={40}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full group-hover:scale-105 transition-transform gpu"
            priority
          />
          <span className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground group-hover:text-primary transition-colors bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">Hybridized</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
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
              user && profile?.avatar_url && "p-0 overflow-hidden",
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
                className="w-10 h-10 object-cover"
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
