---
inclusion: always
---

# Tech Stack

## Framework & Runtime

- **Next.js 16 (Canary)**: App Router with React Server Components
- **React 19**: Latest React with concurrent features
- **TypeScript 5.6**: Strict mode enabled
- **Bun 1.3+**: Package manager and runtime (replaces npm/node for local dev)

## Backend & Database

- **Supabase**: Authentication, database (PostgreSQL), and real-time features
- **@supabase/ssr**: Server-side rendering support for auth
- Supabase clients: separate browser and server implementations

## API Layer

- **Hono**: Edge-native HTTP framework for API routes
- V2 API routes consolidated at `app/api/[[...route]]/route.ts`
- Runs on Vercel Edge Runtime (`export const runtime = "edge"`)
- Legacy Next.js route handlers remain for backward compatibility

## Styling & UI

- **Tailwind CSS 3.4**: Utility-first styling with custom theme
- **shadcn/ui**: Component library (class-variance-authority, clsx, tailwind-merge)
- **Framer Motion**: Animations and transitions
- **Lucide React**: Icon library
- **CSS Variables**: HSL-based color system for theming

## Code Quality

- **Biome 1.9**: Fast Rust-based formatter + linter (replaces ESLint + Prettier)
  - Config: `biome.json`
  - Runs on `app/`, `components/`, `lib/`
- **oxlint 0.16**: Secondary Rust-based linter for React/hooks rules
  - Config: `oxlint.json`
- **Lefthook**: Git hooks (pre-commit: format + lint + typecheck, pre-push: build)
  - Config: `lefthook.yml`

## Common Commands

```bash
# Development (use bun)
bun run dev          # Start dev server on localhost:3000

# Production
bun run build        # Build for production
bun run start        # Start production server

# Code Quality
bun run lint         # Run oxlint + biome lint
bun run format       # Format with biome
bun run check        # Biome check + fix
bun run typecheck    # tsc --noEmit

# Package management
bun install          # Install deps (uses bun.lockb)
bun add <pkg>        # Add dependency
```

## Environment Variables

Required in `.env`:
```
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
NEXT_PUBLIC_SITE_URL=https://hybridized.online
FUNCTION_SECRET=...
```

## Deployment

- **Platform**: Vercel (`organicnz22-2859s-projects`)
- **Domain**: `hybridized.online` (Cloudflare DNS, SSL: Full)
- **Images**: Configured for Supabase storage domain
- **Edge Runtime**: Hono API routes run at the edge
- **CI/CD**: GitHub Actions on push to `main`
