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
