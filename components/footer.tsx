import Link from 'next/link'
import { Fragment } from 'react'
import { LanguageSelector } from './language-selector'

const FOOTER_LINKS = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
] as const;

const SUPPORT_LINKS = [
  { href: '/support', label: 'Support & Resources' },
] as const;

export function Footer() {
  return (
    <footer className="bg-black border-t border-white/5 mt-auto">
      <div className="px-4 md:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/50">
        {/* Left Side */}
        <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
          <span>© {new Date().getFullYear()} Hybridized</span>
          {FOOTER_LINKS.map((link) => (
            <Fragment key={link.href}>
              <span className="text-white/20" aria-hidden="true">·</span>
              <Link href={link.href} className="hover:text-white/90 hover:underline transition-colors">
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
              <span className="text-white/20" aria-hidden="true">·</span>
              <Link href={link.href} className="hover:text-white/90 hover:underline transition-colors">
                {link.label}
              </Link>
            </Fragment>
          ))}
        </div>
      </div>
    </footer>
  );
}
