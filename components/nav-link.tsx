'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

type NavLinkProps = {
  href: string
  label: string
  highlight?: boolean
  variant?: 'desktop' | 'mobile'
  onClick?: () => void
}

export function NavLink({ href, label, highlight, variant = 'desktop', onClick }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href
  
  if (variant === 'mobile') {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          "block px-4 py-2 rounded-lg font-medium transition-colors",
          isActive && "bg-white/5 text-white",
          highlight
            ? "text-green-400 hover:bg-green-400/10"
            : "text-white/70 hover:bg-white/10 hover:text-white"
        )}
        aria-current={isActive ? 'page' : undefined}
      >
        {label}
      </Link>
    )
  }
  
  return (
    <Link 
      href={href} 
      className={cn(
        "font-semibold text-sm transition-colors relative group",
        isActive && "text-white",
        highlight 
          ? "text-green-400 hover:text-green-300" 
          : "text-white/70 hover:text-white"
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      {label}
      <span className={cn(
        "absolute -bottom-1 left-0 h-0.5 bg-green-400 transition-all",
        isActive ? "w-full" : "w-0 group-hover:w-full"
      )} />
    </Link>
  )
}
