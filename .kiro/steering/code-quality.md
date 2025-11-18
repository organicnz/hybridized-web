---
inclusion: always
---

# Code Quality Standards

## TypeScript Best Practices

- Use strict TypeScript mode (enabled in tsconfig.json)
- Avoid `any` types - use proper type definitions
- Generate database types from Supabase schema when schema changes
- Use type imports: `import type { NextConfig } from "next"`
- Leverage path aliases: `@/*` for cleaner imports

## Component Guidelines

### Server vs Client Components

- **Default to Server Components** - no 'use client' directive needed
- **Use 'use client' only when**:
  - Using React hooks (useState, useEffect, etc.)
  - Handling browser events (onClick, onChange, etc.)
  - Using browser-only APIs
  - Implementing animations with Framer Motion

### Component Structure

```tsx
// Server Component (default)
export default function Page() {
  return <div>Content</div>
}

// Client Component (when needed)
'use client'
import { useState } from 'react'

export function InteractiveComponent() {
  const [state, setState] = useState()
  return <div onClick={() => setState()}>Interactive</div>
}
```

## Code Organization

- One component per file
- Co-locate related files (page.tsx with its components)
- Keep components small and focused
- Extract reusable logic to `lib/` utilities
- Use descriptive, semantic names

## Error Handling

- Handle async operations with try/catch
- Provide user-friendly error messages
- Log errors for debugging but don't expose sensitive info
- Use TypeScript's non-null assertion (`!`) sparingly

## Performance Considerations

- Use Next.js Image component for images
- Implement proper loading states
- Avoid unnecessary client-side JavaScript
- Leverage React Server Components for data fetching
- Use dynamic imports for heavy components

## Naming Conventions

- **Files**: kebab-case for routes, camelCase for utilities
- **Components**: PascalCase
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types/Interfaces**: PascalCase with descriptive names
