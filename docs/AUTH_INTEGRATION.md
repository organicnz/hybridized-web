# Auth Integration Examples

Quick examples for integrating auth into your existing components.

## Header Integration

### Option 1: Replace Existing Header

Replace `components/header.tsx` with the auth-enabled version:

```tsx
// In your layout or page
import { HeaderWithAuth } from "@/components/header-with-auth";

export default function Layout({ children }) {
  return (
    <>
      <HeaderWithAuth />
      {children}
    </>
  );
}
```

### Option 2: Update Existing Header

Modify your existing `components/header.tsx`:

```tsx
import { UserMenu } from "./auth/user-menu";
import { useAuth } from "@/hooks/use-auth";

export function Header() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <header>
      {/* Your existing header code */}

      {/* Replace the User icon link with: */}
      {loading ? (
        <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
      ) : isAuthenticated ? (
        <UserMenu />
      ) : (
        <Link href="/auth/login">
          <User className="w-5 h-5" />
        </Link>
      )}
    </header>
  );
}
```

## Navigation Links

Add auth-aware navigation links:

```tsx
"use client";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

export function Navigation() {
  const { isAuthenticated } = useAuth();

  return (
    <nav>
      <Link href="/home">Home</Link>
      <Link href="/about">About</Link>

      {isAuthenticated ? (
        <>
          <Link href="/profile">Profile</Link>
          <Link href="/dashboard">Dashboard</Link>
        </>
      ) : (
        <>
          <Link href="/auth/login">Login</Link>
          <Link href="/auth/signup">Sign Up</Link>
        </>
      )}
    </nav>
  );
}
```

## Conditional Content

Show different content based on auth state:

```tsx
"use client";
import { useAuth } from "@/hooks/use-auth";

export function WelcomeSection() {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <div>
        <h1>Welcome back, {user.email}!</h1>
        <Link href="/dashboard">Go to Dashboard</Link>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome to Hybridized</h1>
      <Link href="/auth/signup">Get Started</Link>
    </div>
  );
}
```

## Server-Side Protection

Protect entire pages on the server:

```tsx
// app/dashboard/page.tsx
import { requireAuth } from "@/lib/auth/utils";

export default async function DashboardPage() {
  const user = await requireAuth(); // Redirects if not authenticated

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user.email}</p>
    </div>
  );
}
```

## Client-Side Protection

Protect client components:

```tsx
// app/settings/page.tsx
"use client";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <div>
        <h1>Settings</h1>
        {/* Protected content */}
      </div>
    </ProtectedRoute>
  );
}
```

## Profile Display

Show user profile information:

```tsx
"use client";
import { useProfile } from "@/hooks/use-profile";
import Image from "next/image";

export function ProfileCard() {
  const { profile, loading } = useProfile();

  if (loading) return <div>Loading...</div>;
  if (!profile) return null;

  return (
    <div>
      {profile.avatar_url && (
        <Image
          src={profile.avatar_url}
          alt={profile.full_name || "User"}
          width={100}
          height={100}
        />
      )}
      <h2>{profile.full_name}</h2>
      <p>{profile.email}</p>
    </div>
  );
}
```

## Sign Out Button

Add a sign out button anywhere:

```tsx
"use client";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-2 text-red-400 hover:text-red-300"
    >
      <LogOut className="w-4 h-4" />
      Sign Out
    </button>
  );
}
```

## Loading States

Handle loading states properly:

```tsx
"use client";
import { useAuth } from "@/hooks/use-auth";

export function AuthAwareComponent() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <div>Please log in to continue</div>;
  }

  return <div>Authenticated content for {user.email}</div>;
}
```

## Form with Auth

Create forms that require authentication:

```tsx
"use client";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

export function CommentForm() {
  const { user, isAuthenticated } = useAuth();
  const [comment, setComment] = useState("");

  if (!isAuthenticated) {
    return (
      <div>
        <p>Please log in to comment</p>
        <Link href="/auth/login">Login</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Submit comment with user.id
    console.log("Comment from", user.id, ":", comment);
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a comment..."
      />
      <button type="submit">Post Comment</button>
    </form>
  );
}
```

## Middleware Protection

Protect multiple routes at once in `middleware.ts`:

```typescript
import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  // Protected routes
  const protectedPaths = ["/profile", "/dashboard", "/settings", "/admin"];
  const path = request.nextUrl.pathname;

  if (protectedPaths.some((p) => path.startsWith(p))) {
    // Add additional auth checks here if needed
    // The session is already updated by updateSession
  }

  return response;
}
```

## API Route Protection

Protect API routes:

```typescript
// app/api/protected/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Protected API logic
  return NextResponse.json({ data: "Protected data", userId: user.id });
}
```

## Social Auth Integration

Add social login buttons to login page:

```tsx
// In app/auth/login/page.tsx
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";

export default function LoginPage() {
  return (
    <div>
      {/* Your existing login form */}

      {/* Add social auth */}
      <SocialAuthButtons redirectTo="/home" />
    </div>
  );
}
```

Remember to enable OAuth providers in Supabase Dashboard first!
