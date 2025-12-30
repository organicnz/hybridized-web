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
public/       → Static assets (favicon, images, robots.txt)
supabase/     → Supabase migrations and config
```

## Environment Variables

Required in `.env`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run linter
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
- Proxy status: Should be **Proxied** (orange cloud) for security

### Security Configurations

- `robots.txt` blocks 17+ AI crawlers (GPTBot, ClaudeBot, CCBot, etc.)
- Allows legitimate search engines (Googlebot, Bingbot, DuckDuckBot)
- Vercel Security Checkpoint enabled
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff

### Cloudflare Security

- Bot Fight Mode: Enable in Security → Bots
- AI Labyrinth: Enable to trap AI crawlers
- WAF rules can block AI user-agents

## Database Schema

**hybridized** - Main content table
**profiles** - User profiles (linked to Supabase Auth)

## Deployment

Push to `main` branch → Auto-deploys to Vercel
