# CLAUDE.md - Project Context for AI Assistants

## Project Overview

**Hybridized** - Music/audio streaming web application built with Next.js 16, deployed on Vercel.

## Tech Stack

- **Framework:** Next.js 16 (Canary) with App Router
- **Database & Auth:** Supabase
- **Styling:** Tailwind CSS + shadcn/ui
- **Deployment:** Vercel
- **Domain:** hybridized.online (via Cloudflare DNS)

## Key Directories

```
app/          → Next.js App Router pages
components/   → Reusable UI components
lib/          → Utilities, Supabase client, types
public/       → Static assets (favicon, images)
supabase/     → Supabase migrations, edge functions and config
```

## Environment Variables

See `.env.example` for the full list. Minimum required in `.env`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Optional:
- `SUPABASE_SECRET_KEY` - service-role key. Required by the mutating sync
  endpoints (`/api/v1/sync-*`, `/api/v1/match-*`) so their writes bypass RLS.
  Without it those routes fall back to a cookie session and are denied by RLS
  unless called by an authenticated admin.
- `SYNC_SECRET` - shared bearer secret for those endpoints, as an alternative to
  an admin profile (`Authorization: Bearer <SYNC_SECRET>`).
- `NEXT_PUBLIC_SENTRY_DSN` - enables Sentry; leave blank to disable.

## Commands

```bash
bun run dev        # Start dev server
bun run build      # Production build
bun run lint       # oxlint + biome
bun run typecheck  # tsc --noEmit
bun test           # unit tests
```

## Infrastructure

### Hosting

- **Vercel** - Web application hosting (serverless)
- **Supabase** - Database & Auth (remote/hosted, not self-managed)
- **Cloudflare** - DNS management
- No self-hosted servers (no EC2, VPS, etc.)

### DNS (Cloudflare)

- Domain: `hybridized.online`
- A Record: Points to Vercel IP `76.76.21.21`
- CNAME `www`: Points to `vercel-dns.com`
- Proxy status: **DNS only (grey cloud)** - Vercel requires this, do NOT proxy

### Security Configurations

- `app/robots.ts` blocks AI crawlers (GPTBot, ClaudeBot, CCBot, etc.) and allows legitimate search engines (Googlebot, Bingbot, DuckDuckBot)
- Security headers set in `next.config.ts` (X-Frame-Options, X-Content-Type-Options, HSTS, Permissions-Policy, COOP, CSP report-only)
- Vercel Security Checkpoint enabled

### Cloudflare Security

- Bot Fight Mode: Enable in Security → Bots
- AI Labyrinth: Enable to trap AI crawlers
- WAF rules can block AI user-agents

## Database Schema

- **episodes** - podcast episode content (public read, authenticated write)
- **bands** - artists/bands (public read, authenticated write)
- **profiles** - user profiles linked to Supabase Auth (owner-only access)

## Design / Beautification

Premium dark glassmorphic. Deep blacks (`--background: 240 10% 3%`), refined purple/pink/blue gradient meshes, glass cards, fluid typography, refined shadows/brightness. Always merge to `main`; deliver to prod accordingly.

## Deployment

Always merge to `main`. Deliver into prod accordingly.

Push to `main` branch → Auto-deploys to Vercel (production)
