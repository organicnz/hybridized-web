"use client";

import Link from "next/link";
import Image from "next/image";
import { User, Menu } from "lucide-react";
import { useState, useCallback, Suspense } from "react";
import { cn } from "@/lib/utils";
import { SearchBar } from "./search-bar";
import { MobileMenu } from "./mobile-menu";
import { NavLink } from "./nav-link";
import { NAV_LINKS, HEADER_STYLES } from "@/lib/constants/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { profile } = useProfile();

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <header className="bg-[#000000] border-b border-white/5 sticky top-0 z-50 backdrop-blur-md bg-black/95">
      <div className="px-4 md:px-8 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0 group">
          <Image
            src="/logo.png"
            alt="Hybridized Logo"
            title="Hybridized - Home"
            width={40}
            height={40}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full group-hover:scale-105 transition-transform"
            priority
          />
          <span className="text-xl md:text-2xl font-bold text-white group-hover:text-[#1DB954] transition-colors">
            Hybridized
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center gap-6"
          aria-label="Main navigation"
        >
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} {...link} variant="desktop" />
          ))}
        </nav>

        {/* Search & User */}
        <div className="flex items-center gap-2 md:gap-3">
          <Suspense fallback={<div className="w-40 md:w-64 h-10" />}>
            <SearchBar />
          </Suspense>
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
            onClick={toggleMobileMenu}
            className={cn("md:hidden", HEADER_STYLES.button)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className={HEADER_STYLES.icon} />
          </button>
        </div>
      </div>

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={closeMobileMenu}
        navLinks={NAV_LINKS}
      />
    </header>
  );
}
