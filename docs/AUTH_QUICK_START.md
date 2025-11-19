# Auth Quick Start

Get authentication working in 5 minutes.

## 1. Run Database Migration

```bash
# Apply the auth setup migration to your Supabase database
# Option A: Using Supabase CLI
npx supabase db push

# Option B: Run SQL directly in Supabase Dashboard
# Copy contents of supabase/migrations/20240101000000_auth_setup.sql
# Paste into SQL Editor and execute
```

## 2. Add Environment Variable

Add to your `.env` file:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 3. Test the Auth Flow

```bash
npm run dev
```

Visit:

- `/auth/signup` - Create account
- `/auth/login` - Sign in
- `/profile` - View/edit profile (protected)

## 4. Add User Menu to Header

Update your header component:

```tsx
import { UserMenu } from "@/components/auth/user-menu";

export function Header() {
  return (
    <header>
      {/* Your existing nav */}
      <UserMenu />
    </header>
  );
}
```

## 5. Protect a Route

### Client Component

```tsx
"use client";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function MyPage() {
  return (
    <ProtectedRoute>
      <div>Protected content</div>
    </ProtectedRoute>
  );
}
```

### Server Component

```tsx
import { requireAuth } from "@/lib/auth/utils";

export default async function MyPage() {
  const user = await requireAuth(); // Auto-redirects if not logged in
  return <div>Welcome {user.email}</div>;
}
```

## Common Patterns

### Get Current User (Client)

```tsx
"use client";
import { useAuth } from "@/hooks/use-auth";

export function MyComponent() {
  const { user, isAuthenticated } = useAuth();

  return isAuthenticated ? (
    <div>Hello {user.email}</div>
  ) : (
    <div>Please login</div>
  );
}
```

### Get User Profile (Client)

```tsx
"use client";
import { useProfile } from "@/hooks/use-profile";

export function ProfileDisplay() {
  const { profile, updateProfile } = useProfile();

  return (
    <div>
      <h1>{profile?.full_name}</h1>
      <button onClick={() => updateProfile({ full_name: "New Name" })}>
        Update
      </button>
    </div>
  );
}
```

### Sign Out

```tsx
"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return <button onClick={handleSignOut}>Sign Out</button>;
}
```

## Available Routes

| Route                   | Description      | Protected |
| ----------------------- | ---------------- | --------- |
| `/auth/login`           | Sign in page     | No        |
| `/auth/signup`          | Registration     | No        |
| `/auth/forgot-password` | Request reset    | No        |
| `/auth/reset-password`  | Set new password | No        |
| `/auth/callback`        | OAuth callback   | No        |
| `/profile`              | User settings    | Yes       |

## Hooks

- `useAuth()` - Get current user and auth state
- `useProfile()` - Get and update user profile

## Utilities

- `getCurrentUser()` - Get user in Server Component
- `requireAuth()` - Require auth (redirects if not logged in)
- `getUserProfile(userId)` - Get profile data
- `isAuthenticated()` - Check auth status

## Components

- `<UserMenu />` - Dropdown with profile and sign out
- `<ProtectedRoute>` - Wrap client components to require auth

## Next Steps

See [AUTH.md](./AUTH.md) for complete documentation including:

- OAuth providers
- Magic links
- MFA setup
- Production checklist
- Troubleshooting
