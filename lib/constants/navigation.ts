/**
 * Navigation link configuration
 * @property href - Route path
 * @property label - Display text
 * @property highlight - Whether to apply accent styling (e.g., donation button)
 */
export type NavLink = {
  href: string;
  label: string;
  highlight?: boolean;
};

/**
 * Main navigation links for the site header
 * Ordered as they should appear in the navigation bar
 */
export const NAV_LINKS = [
  { href: "/home", label: "Main" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/donation", label: "Donation", highlight: true },
] as const satisfies readonly NavLink[];

/**
 * Type helper for individual navigation link items
 * Provides literal types for href and label
 */
export type NavLinkItem = (typeof NAV_LINKS)[number];

/**
 * Reusable style classes for header components
 * Using design token button variants
 */
export const HEADER_STYLES = {
  button:
    "btn btn-ghost btn-sm h-10 w-10 p-0 rounded-full hover:bg-accent active:bg-accent transition-colors",
  icon: "w-5 h-5 text-muted-foreground",
} as const;
