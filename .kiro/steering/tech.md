---
inclusion: always
---

# Tech Stack

## Framework & Runtime

- **Next.js 16 (Canary)**: App Router with React Server Components
- **React 19**: Latest React with concurrent features
- **TypeScript 5.6**: Strict mode enabled

## Backend & Database

- **Supabase**: Authentication, database (PostgreSQL), and real-time features
- **@supabase/ssr**: Server-side rendering support for auth
- Supabase clients: separate browser and server implementations

## Styling & UI

- **Tailwind CSS 3.4**: Utility-first styling with custom theme
- **shadcn/ui**: Component library (class-variance-authority, clsx, tailwind-merge)
- **Framer Motion**: Animations and transitions
- **Lucide React**: Icon library
- **CSS Variables**: HSL-based color system for theming

## Development Tools

- **ESLint**: Next.js config (ignored during builds)
- **TypeScript**: Build errors ignored in config (fix before production)
- **PostCSS & Autoprefixer**: CSS processing

## Common Commands

```bash
# Development
npm run dev          # Start dev server on localhost:3000

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
```

## Environment Variables

Required in `.env`:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Deployment

- **Platform**: Vercel (optimized)
- **Images**: Configured for Supabase storage domain
- **Edge Runtime**: Ready for edge functions
