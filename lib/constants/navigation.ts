export type NavLink = {
  href: string
  label: string
  highlight?: boolean
}

export const NAV_LINKS = [
  { href: '/home', label: 'Main' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/donation', label: 'Donation', highlight: true },
] as const satisfies readonly NavLink[]

export const HEADER_STYLES = {
  button: "w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors",
  icon: "w-4 h-4 text-white",
} as const
