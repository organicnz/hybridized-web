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
    <footer className="surface-shell border-t">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 text-sm text-muted-foreground md:flex-row md:px-8">
        {/* Left Side */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:justify-start">
          <span className="font-display font-semibold tracking-tight text-foreground/80">
            © {new Date().getFullYear()} Hybridized
          </span>
          {FOOTER_LINKS.map((link) => (
            <Fragment key={link.href}>
              <span className="text-muted-foreground/40" aria-hidden="true">
                ·
              </span>
              <Link
                href={link.href}
                className="rounded-md underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {link.label}
              </Link>
            </Fragment>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:justify-end">
          <LanguageSelector />
          {SUPPORT_LINKS.map((link) => (
            <Fragment key={link.href}>
              <span className="text-muted-foreground/40" aria-hidden="true">
                ·
              </span>
              <Link
                href={link.href}
                className="rounded-md underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
