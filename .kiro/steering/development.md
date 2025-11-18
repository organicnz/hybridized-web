---
inclusion: always
---

# Development Workflow

## Getting Started

1. Clone repository
2. Copy `.env.example` to `.env`
3. Add Supabase credentials to `.env`
4. Run `npm install`
5. Run `npm run dev`

## Development Server

- Runs on `http://localhost:3000`
- Hot reload enabled
- Fast Refresh for React components
- Error overlay for debugging

## Git Workflow

### Ignored Files

- `node_modules/`
- `.next/` build output
- `.env` and `.env*.local`
- `.vercel/` deployment config
- `.DS_Store` and system files
- TypeScript build info

### Commit Best Practices

- Write clear, descriptive commit messages
- Keep commits focused and atomic
- Test before committing
- Don't commit sensitive data or credentials

## Database Changes

When modifying Supabase schema:

1. Make changes in Supabase dashboard or SQL editor
2. Regenerate TypeScript types
3. Update `lib/types/database.types.ts`
4. Test queries with new types
5. Update relevant components

## Adding New Routes

1. Create folder in `app/` directory
2. Add `page.tsx` for route content
3. Optional: Add `layout.tsx` for route-specific layout
4. Update navigation in `components/header.tsx`
5. Test routing and navigation

## Adding shadcn/ui Components

```bash
npx shadcn-ui@latest add [component-name]
```

Components will be added to `components/ui/` with proper configuration.

## Environment Variables

- Prefix public vars with `NEXT_PUBLIC_`
- Server-only vars don't need prefix
- Never commit `.env` file
- Update `.env.example` when adding new vars
- Restart dev server after changing env vars

## Build & Deploy

### Local Production Build

```bash
npm run build    # Build for production
npm run start    # Test production build locally
```

### Vercel Deployment

- Push to GitHub
- Vercel auto-deploys from main branch
- Add environment variables in Vercel dashboard
- Preview deployments for PRs

## Troubleshooting

### Common Issues

- **Build errors ignored**: Fix TypeScript/ESLint errors before production
- **Supabase connection**: Verify env vars are set correctly
- **Middleware issues**: Check matcher pattern in `middleware.ts`
- **Styling not applied**: Ensure Tailwind content paths include your files

### Debug Tools

- Next.js error overlay in development
- Browser DevTools for client-side debugging
- Vercel logs for production issues
- Supabase dashboard for database queries
