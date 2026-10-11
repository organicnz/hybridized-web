---
inclusion: always
---

# Project Structure

## Directory Organization

```
├── app/                    # Next.js App Router (pages & layouts)
│   ├── layout.tsx         # Root layout with Inter font
│   ├── page.tsx           # Landing page
│   ├── globals.css        # Global styles & Tailwind
│   ├── home/              # Main content page
│   ├── about/             # About page
│   ├── tests/             # Interactive tests
│   ├── contact/           # Contact page
│   ├── donation/          # Donation page
│   └── auth/
│       └── login/         # Authentication pages
├── components/            # Reusable React components
│   ├── header.tsx         # Site header with navigation
│   └── footer.tsx         # Site footer
├── lib/                   # Utilities and configurations
│   ├── supabase/          # Supabase client setup
│   │   ├── client.ts      # Browser client (createBrowserClient)
│   │   ├── server.ts      # Server client (createServerClient)
│   │   └── middleware.ts  # Session management
│   ├── types/             # TypeScript type definitions
│   │   └── database.types.ts  # Supabase generated types
│   └── utils.ts           # Utility functions (cn helper)
├── context/               # React context providers (empty)
├── scripts/               # Build/utility scripts (empty)
├── docs/                  # Documentation (empty)
└── middleware.ts          # Next.js middleware for auth
```

## Key Conventions

### Routing
- App Router file-based routing in `app/` directory
- Each route has its own folder with `page.tsx`
- Shared layouts use `layout.tsx`

### Supabase Integration
- **Browser components**: Import from `@/lib/supabase/client`
- **Server components**: Import from `@/lib/supabase/server`
- Middleware handles session updates automatically

### Styling Patterns
- Tailwind utility classes for all styling
- Gradient backgrounds: `from-purple-X via-Y to-blue-Z`
- Glassmorphism: `bg-white/10 backdrop-blur-sm`
- Hover effects: `hover:scale-105 transition-transform`
- Color system uses CSS variables with HSL values

### Component Structure
- Functional components with TypeScript
- Server components by default (no 'use client' unless needed)
- Lucide icons for all iconography
- Link component from next/link for navigation

### Path Aliases
- `@/*` maps to project root (configured in tsconfig.json)
- Example: `import { createClient } from '@/lib/supabase/client'`

### Type Safety
- Strict TypeScript enabled
- Database types generated from Supabase schema
- Props typed with TypeScript interfaces

---

## Policy
Always merge to `main`. Deliver into prod accordingly. No PR branches, no staging, no preview deployments.

## Design / Beautification
Premium dark glassmorphic. Deep blacks, refined purple/pink/blue gradient meshes (`bg-gradient-to-br`), glass cards (`backdrop-blur-2xl`, `border-white/10`), fluid typography, refined shadows (`shadow-[...]`), gradient text (`gradient-text`). 10x pro aesthetic executed across theme, components, layout, docs, and skills.
