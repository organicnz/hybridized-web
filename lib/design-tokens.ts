/**
 * Design Tokens — Single source of truth for visual design.
 * All values are Tailwind-compatible and can be used via CSS variables or utilities.
 */

export const tokens = {
  /** Base spacing unit (8px). All spacing derives from this. */
  space: {
    base: 8,
    /** Spacing scale: 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32 */
    scale: (n: number) => `${n * 8}px`,
    /** Fluid spacing for responsive gaps */
    fluid: {
      xs: "clamp(4px, 1vw, 8px)",
      sm: "clamp(8px, 1.5vw, 16px)",
      md: "clamp(16px, 2vw, 24px)",
      lg: "clamp(24px, 3vw, 32px)",
      xl: "clamp(32px, 4vw, 48px)",
      "2xl": "clamp(48px, 5vw, 64px)",
    },
  },

  /** Border radius scale */
  radius: {
    none: "0",
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    "2xl": "24px",
    full: "9999px",
  },

  /** Box shadow elevation system */
  elevation: {
    /** Flat — no shadow, just border */
    flat: "0 0 0 1px hsl(var(--border))",
    /** Raised — subtle depth */
    raised: "0 4px 12px -4px hsl(0 0% 0% / 0.3), 0 0 0 1px hsl(var(--border))",
    /** Floating — pronounced depth for modals, dropdowns, player bar */
    floating: "0 12px 28px -8px hsl(0 0% 0% / 0.4), 0 0 0 1px hsl(var(--border))",
    /** Overlay — maximum depth for dialogs, sheets */
    overlay: "0 20px 40px -12px hsl(0 0% 0% / 0.5), 0 0 0 1px hsl(var(--border))",
    /** Glow — colored glow for primary actions, audio player */
    glow: (color = "var(--primary)") => `0 0 24px ${color}66, 0 0 0 1px hsl(var(--border))`,
    /** Inner — inset shadow for inputs, pressed states */
    inner: "inset 0 2px 4px -2px hsl(0 0% 0% / 0.2)",
  },

  /** Typography scale with fluid clamping */
  typography: {
    /** Font families */
    fontFamily: {
      sans: "var(--font-sans, system-ui, sans-serif)",
      mono: "var(--font-mono, ui-monospace, monospace)",
      display: "var(--font-display, var(--font-sans, system-ui, sans-serif))",
    },
    /** Fluid heading sizes */
    heading: {
      "2xl": "clamp(2.5rem, 5vw, 4.5rem)", // ~40px–72px
      xl: "clamp(2rem, 4vw, 3rem)", // ~32px–48px
      lg: "clamp(1.5rem, 3vw, 2.25rem)", // ~24px–36px
      md: "clamp(1.25rem, 2.5vw, 1.75rem)", // ~20px–28px
      sm: "clamp(1.125rem, 2vw, 1.5rem)", // ~18px–24px
      xs: "clamp(1rem, 1.5vw, 1.25rem)", // ~16px–20px
    },
    /** Body text sizes */
    body: {
      lg: "clamp(1.125rem, 1.5vw, 1.25rem)", // ~18px–20px
      md: "clamp(1rem, 1.25vw, 1.125rem)", // ~16px–18px
      sm: "clamp(0.875rem, 1vw, 1rem)", // ~14px–16px
      xs: "clamp(0.8125rem, 0.875vw, 0.875rem)", // ~13px–14px
    },
    /** Line heights */
    leading: {
      tight: "1.1",
      snug: "1.3",
      normal: "1.5",
      relaxed: "1.625",
      loose: "1.75",
    },
    /** Font weights */
    weight: {
      light: "300",
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extrabold: "800",
      black: "900",
    },
  },

  /** Color palette — semantic, theme-aware via CSS variables */
  color: {
    /** Semantic colors (map to CSS variables in globals.css) */
    semantic: {
      background: "hsl(var(--background))",
      foreground: "hsl(var(--foreground))",
      card: "hsl(var(--card))",
      "card-foreground": "hsl(var(--card-foreground))",
      popover: "hsl(var(--popover))",
      "popover-foreground": "hsl(var(--popover-foreground))",
      primary: "hsl(var(--primary))",
      "primary-foreground": "hsl(var(--primary-foreground))",
      secondary: "hsl(var(--secondary))",
      "secondary-foreground": "hsl(var(--secondary-foreground))",
      muted: "hsl(var(--muted))",
      "muted-foreground": "hsl(var(--muted-foreground))",
      accent: "hsl(var(--accent))",
      "accent-foreground": "hsl(var(--accent-foreground))",
      destructive: "hsl(var(--destructive))",
      "destructive-foreground": "hsl(var(--destructive-foreground))",
      border: "hsl(var(--border))",
      input: "hsl(var(--input))",
      ring: "hsl(var(--ring))",
    },
    /** Brand gradients */
    gradient: {
      brand:
        "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(280 80% 60%) 50%, hsl(220 80% 60%) 100%)",
      brandReverse:
        "linear-gradient(135deg, hsl(220 80% 60%) 0%, hsl(280 80% 60%) 50%, hsl(var(--primary)) 100%)",
      hero: "linear-gradient(to bottom right, hsl(270 50% 15%), hsl(0 0% 0%), hsl(240 50% 10%))",
      card: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--muted)) 100%)",
      border: "linear-gradient(135deg, hsl(var(--border)) 0%, hsl(var(--ring)) 100%)",
      purplePinkBlue:
        "linear-gradient(to right, hsl(270 80% 60%), hsl(330 80% 60%), hsl(220 80% 60%))",
      greenEmerald: "linear-gradient(to right, hsl(140 60% 45%), hsl(160 60% 45%))",
      goldOrange: "linear-gradient(to right, hsl(45 100% 55%), hsl(30 100% 55%))",
    },
    /** Status colors (for states, not themed) */
    status: {
      success: "hsl(142 71% 45%)",
      warning: "hsl(38 92% 50%)",
      error: "hsl(0 84% 60%)",
      info: "hsl(199 89% 48%)",
    },
  },

  /** Transition durations & easings */
  motion: {
    duration: {
      instant: "50ms",
      fast: "100ms",
      normal: "200ms",
      slow: "300ms",
      slower: "500ms",
    },
    easing: {
      linear: "linear",
      ease: "ease",
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
      easeOut: "cubic-bezier(0, 0, 0.2, 1)",
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
      spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    },
  },

  /** Z-index layers */
  zIndex: {
    base: 0,
    dropdown: 100,
    sticky: 200,
    header: 300,
    modal: 400,
    popover: 500,
    tooltip: 600,
    toast: 700,
  },

  /** Breakpoints (matching Tailwind) */
  breakpoint: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
} as const;

/** Type-safe token access */
export type Tokens = typeof tokens;

/** Helper to get CSS variable value */
export function cssVar(name: string): string {
  return `var(${name})`;
}

/** Generate Tailwind-compatible class strings from tokens */
export function tokenToClass(path: string, value: string | number): string {
  return `${path}-[${value}]`;
}

export default tokens;
