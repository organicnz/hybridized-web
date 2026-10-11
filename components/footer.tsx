"use client";

import Link from "next/link";
import { Fragment } from "react";
import { LanguageSelector } from "./language-selector";

const FOOTER_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

const SUPPORT_LINKS = [{ href: "/support", label: "Support & Resources" }] as const;

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-gradient-to-t from-black/80 to-background/60 backdrop-blur-xl">
      <div className="px-4 md:px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
        {/* Left Side */}
        <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
          <span>© {new Date().getFullYear()} Hybridized</span>
          {FOOTER_LINKS.map((link) => (
            <Fragment key={link.href}>
              <span className="text-muted-foreground/50" aria-hidden="true">
                ·
              </span>
              <Link
                href={link.href}
                className="hover:text-foreground underline-offset-2 hover:underline transition-colors"
              >
                {link.label}
              </Link>
            </Fragment>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4 flex-wrap justify-center md:justify-end">
          <LanguageSelector />
          {SUPPORT_LINKS.map((link) => (
            <Fragment key={link.href}>
              <span className="text-muted-foreground/50" aria-hidden="true">
                ·
              </span>
              <Link
                href={link.href}
                className="hover:text-foreground underline-offset-2 hover:underline transition-colors"
              >
                {link.label}
              </Link>
            </Fragment>
          ))}
        </div>
      </div>
    </footer>
  );
}
