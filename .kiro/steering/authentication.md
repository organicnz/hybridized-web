---
inclusion: always
---

# Authentication Patterns

## Supabase Auth Setup

### Client-Side Auth (Browser Components)

```tsx
'use client'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const supabase = createClient()
  // Use for client-side auth operations
}
```

### Server-Side Auth (Server Components)

```tsx
import { createClient } from '@/lib/supabase/server'

export default async function ProtectedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // Use for server-side auth checks
}
```

## Middleware

- Middleware runs on every request (configured in `middleware.ts`)
- Automatically updates session cookies
- Handles auth state across page navigations
- Excludes static assets via matcher config

## Protected Routes

To protect a route:

1. Check user session in Server Component
2. Redirect to login if not authenticated
3. Use `redirect()` from 'next/navigation'

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ProtectedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  return <div>Protected content</div>
}
```

## User Profile Access

- User data stored in `profiles` table
- Linked to auth.users via UUID
- Access via Supabase client queries
- Update profile data through Supabase API

## Environment Variables

Never commit `.env` file - use `.env.example` as template:
- `NEXT_PUBLIC_SUPABASE_URL`: Public Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anon key (safe for client)
