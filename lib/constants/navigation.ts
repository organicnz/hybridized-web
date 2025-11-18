/**
 * Navigation link configuration
 * @property href - Route path
 * @property label - Display text
 * @property highlight - Whether to apply accent styling (e.g., donation button)
 */
export type NavLink = {
  href: string
  label: string
  highlight?: boolean
}

/**
 * Main navigation links for the site header
 * Ordered as they should appear in the navigation bar
 */
export const NAV_LINKS = [
  { href: '/home', label: 'Main' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/donation', label: 'Donation', highlight: true },
] as const satisfies readonly NavLink[]

/**
 * Type helper for individual navigation link items
 * Provides literal types for href and label
 */
export type NavLinkItem = typeof NAV_LINKS[number]

/**
 * Reusable style classes for header components
 * Using Spotify color palette
 */
export const HEADER_STYLES = {
  button: "w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors",
  icon: "w-5 h-5 text-white/70"
} as const
