import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 0 0 1px hsl(var(--border))",
        "card-raised":
          "0 4px 12px -4px hsl(0 0% 0% / 0.3), 0 0 0 1px hsl(var(--border))",
        "card-floating":
          "0 12px 28px -8px hsl(0 0% 0% / 0.4), 0 0 0 1px hsl(var(--border))",
        overlay:
          "0 20px 40px -12px hsl(0 0% 0% / 0.5), 0 0 0 1px hsl(var(--border))",
        glow: "0 0 24px hsl(var(--primary) / 0.35), 0 0 0 1px hsl(var(--border))",
        header:
          "0 1px 0 0 rgba(255,255,255,0.05), 0 8px 32px -8px rgba(124,58,237,0.18)",
        player:
          "0 -20px 60px -15px rgba(124,58,237,0.18), 0 0 0 1px rgba(255,255,255,0.05)",
      },
      keyframes: {
        "mesh-pan": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.75" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "mesh-pan": "mesh-pan 12s ease-in-out infinite",
        shimmer: "shimmer 2.2s linear infinite",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
