---
inclusion: always
---

# Database Patterns

## Supabase Client Usage

### Query Patterns

```tsx
// Server Component - Fetch data
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hybridized')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching data:', error)
    return <div>Error loading data</div>
  }
  
  return <div>{/* Render data */}</div>
}
```

```tsx
// Client Component - Interactive queries
'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function InteractiveList() {
  const [data, setData] = useState([])
  const supabase = createClient()
  
  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('hybridized').select('*')
      setData(data || [])
    }
    fetchData()
  }, [])
  
  return <div>{/* Render data */}</div>
}
```

## Schema Tables

### hybridized

Stores music hybrid entries:
- `id`: Primary key (int)
- `created_at`: Timestamp
- `name`: Hybrid name (text)
- `description`: Description (text)
- `formula`: Musical formula (text)
- `id_new`: Alternative ID (int)
- `iframe_url`: Embedded content URL (text)
- `cover_url`: Cover image URL (text)

### profiles

User profile data:
- `id`: Primary key (uuid) - links to auth.users
- `created_at`: Timestamp
- `email`: User email (text)
- `full_name`: Display name (text)
- `avatar_url`: Profile picture URL (text)

## Type Safety

Import generated types:
```tsx
import type { Database } from '@/lib/types/database.types'

type Hybridized = Database['public']['Tables']['hybridized']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']
```

## Real-time Subscriptions

```tsx
'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

export function RealtimeComponent() {
  const supabase = createClient()
  
  useEffect(() => {
    const channel = supabase
      .channel('hybridized-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'hybridized' },
        (payload) => {
          console.log('Change received!', payload)
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])
}
```

## Storage (Images)

Configured for Supabase storage domain in `next.config.ts`:
```tsx
import Image from 'next/image'

<Image 
  src="https://neslxchdtibzhxijxcbg.supabase.co/storage/v1/..."
  alt="Description"
  width={500}
  height={300}
/>
```

## Row Level Security (RLS)

- Enable RLS on all tables in production
- Define policies for read/write access
- Use auth.uid() in policies for user-specific data
- Test policies thoroughly before deploying
