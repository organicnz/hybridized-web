---
inclusion: always
---

# Development Workflow

## Getting Started

1. Clone repository
2. Copy `.env.example` to `.env` and fill in credentials
3. Install [Bun](https://bun.sh): `curl -fsSL https://bun.sh/install | bash`
4. Run `bun install`
5. Run `bun run dev`

## Development Server

- Runs on `http://localhost:3000`
- Hot reload enabled
- Fast Refresh for React components

## Code Quality

### Linting & Formatting

```bash
bun run lint        # oxlint + biome lint
bun run format      # biome format --write
bun run check       # biome check --write (lint + format)
bun run typecheck   # tsc --noEmit
```

- **Biome** handles formatting and most lint rules (`biome.json`)
- **oxlint** handles React/hooks specific rules (`oxlint.json`)
- **Lefthook** runs checks automatically on git commit/push

### Git Hooks (Lefthook)

Pre-commit (parallel):
- `biome format --write` on staged files
- `biome lint` on staged files
- `oxlint` on staged files
- `tsc --noEmit` typecheck

Pre-push:
- `bun run build`

## API Routes

- Legacy routes: `app/api/<name>/route.ts` (NextRequest/NextResponse)
- **V2 routes via Hono**: `app/api/[[...route]]/route.ts`
  - Runs on Edge runtime
  - Endpoints: `/api/v2/episodes`, `/api/v2/episode/:id`, `/api/v2/firstory-feed`,
    `/api/v2/playlist-episodes`, `/api/v2/sync-episodes`, `/api/v2/sync-playlists`, `/api/v2/match-episodes`

## Git Workflow

### Ignored Files

- `node_modules/`, `bun.lockb` (committed — used for reproducible installs)
- `.next/` build output
- `.env` and `.env*.local`
- `.vercel/` deployment config
- `.DS_Store` and system files

### Commit Best Practices

- Write clear, descriptive commit messages
- Keep commits focused and atomic
- Lefthook will lint/format automatically on commit
- Don't commit sensitive data or credentials

## Database Changes

When modifying Supabase schema:

1. Make changes in Supabase dashboard or SQL editor
2. Regenerate TypeScript types via Supabase MCP or CLI
3. Update `lib/types/database.types.ts`
4. Test queries with new types
5. Update relevant components

## Adding New Routes

1. Create folder in `app/` directory
2. Add `page.tsx` for route content
3. Optional: Add `layout.tsx` for route-specific layout
4. Update navigation in `components/header.tsx`

## Adding API Endpoints

Prefer adding to the Hono router in `app/api/[[...route]]/route.ts`:

```ts
app.get("/v2/my-endpoint", async (c) => {
  return c.json({ data: "..." })
})
```

## Adding shadcn/ui Components

```bash
bunx shadcn-ui@latest add [component-name]
```

## Environment Variables

- Prefix public vars with `NEXT_PUBLIC_`
- Server-only vars don't need prefix
- Never commit `.env` file
- Update `.env.example` when adding new vars

## Build & Deploy

### Local Production Build

```bash
bun run build    # Build for production
bun run start    # Test production build locally
```

### Vercel Deployment

- Push to `main` → GitHub Actions runs CI → Vercel auto-deploys
- Environment variables managed in Vercel dashboard
- Preview deployments for PRs

## Troubleshooting

### Common Issues

- **Biome errors**: Run `bun run check` to auto-fix
- **Supabase connection**: Verify env vars are set correctly
- **Middleware issues**: Check matcher pattern in `middleware.ts`
- **Bun not found**: Install via `curl -fsSL https://bun.sh/install | bash`

### Debug Tools

- Next.js error overlay in development
- Browser DevTools for client-side debugging
- Vercel logs for production issues
- Supabase dashboard for database queries
