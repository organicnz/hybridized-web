import { cn } from '@/lib/utils'

/**
 * Reusable style constants for header components
 */
export const HEADER_STYLES = {
  button: "w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors",
  icon: "w-4 h-4 text-white",
} as const

/**
 * Composable header button styles with optional className override
 */
export const getHeaderButtonStyles = (className?: string) =>
  cn(
    "w-9 h-9 rounded-full bg-white/10",
    "flex items-center justify-center",
    "hover:bg-white/20 transition-colors",
    className
  )

/**
 * Composable header icon styles with optional className override
 */
export const getHeaderIconStyles = (className?: string) =>
  cn("w-4 h-4 text-white", className)
