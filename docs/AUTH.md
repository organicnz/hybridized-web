# Authentication Guide

Complete authentication system for Hybridized using Supabase Auth.

## Features

- ✅ Email/Password Authentication
- ✅ User Registration with Email Verification
- ✅ Password Reset Flow
- ✅ Protected Routes (Client & Server)
- ✅ User Profile Management
- ✅ Session Management
- ✅ Auth State Hooks
- ✅ User Menu Component

## Setup

### 1. Environment Variables

Add to your `.env` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Database Setup

Ensure your Supabase project has the `profiles` table:

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT,
  full_name TEXT,
  avatar_url TEXT
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3. Supabase Email Settings

Configure email templates in Supabase Dashboard:

- Authentication > Email Templates
- Customize confirmation and password reset emails
- Set redirect URLs to match your domain

## Usage

### Client Components

#### Using Auth Hook

```tsx
"use client";
import { useAuth } from "@/hooks/use-auth";

export function MyComponent() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please login</div>;

  return <div>Welcome {user.email}</div>;
}
```

#### Using Profile Hook

```tsx
"use client";
import { useProfile } from "@/hooks/use-profile";

export function ProfileComponent() {
  const { profile, loading, updateProfile } = useProfile();

  const handleUpdate = async () => {
    await updateProfile({ full_name: "New Name" });
  };

  return <div>{profile?.full_name}</div>;
}
```

#### Protected Client Component

```tsx
"use client";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function ProtectedPage() {
  return (
    <ProtectedRoute>
      <div>Protected content</div>
    </ProtectedRoute>
  );
}
```

### Server Components

#### Check Authentication

```tsx
import { getCurrentUser, requireAuth } from "@/lib/auth/utils";

// Option 1: Get user (returns null if not authenticated)
export default async function Page() {
  const user = await getCurrentUser();

  if (!user) {
    return <div>Please login</div>;
  }

  return <div>Welcome {user.email}</div>;
}

// Option 2: Require auth (redirects if not authenticated)
export default async function ProtectedPage() {
  const user = await requireAuth(); // Redirects to /auth/login if not authenticated

  return <div>Protected content for {user.email}</div>;
}
```

#### Get User Profile

```tsx
import { requireAuth, getUserProfile } from "@/lib/auth/utils";

export default async function ProfilePage() {
  const user = await requireAuth();
  const profile = await getUserProfile(user.id);

  return (
    <div>
      <h1>{profile?.full_name}</h1>
      <p>{profile?.email}</p>
    </div>
  );
}
```

### User Menu Component

Add to your header/navigation:

```tsx
import { UserMenu } from "@/components/auth/user-menu";

export function Header() {
  return (
    <header>
      <nav>
        {/* Your navigation */}
        <UserMenu />
      </nav>
    </header>
  );
}
```

## Routes

### Public Routes

- `/auth/login` - Sign in page
- `/auth/signup` - Registration page
- `/auth/forgot-password` - Request password reset
- `/auth/reset-password` - Set new password (from email link)
- `/auth/callback` - OAuth callback handler

### Protected Routes

- `/profile` - User profile settings

### API Routes

- `POST /auth/logout` - Sign out endpoint

## Authentication Flow

### Sign Up

1. User fills signup form
2. Supabase creates auth user
3. Trigger creates profile record
4. Confirmation email sent
5. User clicks email link
6. Redirected to `/home`

### Sign In

1. User enters credentials
2. Supabase validates
3. Session created
4. Redirected to `/home`

### Password Reset

1. User requests reset at `/auth/forgot-password`
2. Reset email sent
3. User clicks email link
4. Redirected to `/auth/reset-password`
5. User sets new password
6. Redirected to `/auth/login`

### Sign Out

1. User clicks sign out in UserMenu
2. Supabase clears session
3. Redirected to `/auth/login`

## Middleware

The middleware automatically:

- Updates session on every request
- Handles cookie management
- Maintains auth state across navigation

Protected routes can be added in `middleware.ts`:

```typescript
const protectedPaths = ["/profile", "/dashboard", "/admin"];
```

## Security Best Practices

1. **Row Level Security (RLS)**: Always enable RLS on tables
2. **Environment Variables**: Never commit `.env` file
3. **Password Requirements**: Minimum 6 characters (configurable in Supabase)
4. **Email Verification**: Enabled by default
5. **Session Management**: Handled automatically by middleware

## Customization

### Redirect URLs

Change redirect destinations in:

- `app/auth/login/page.tsx` - `REDIRECT_AFTER_LOGIN`
- `app/auth/signup/page.tsx` - Email redirect
- `app/auth/forgot-password/page.tsx` - Reset redirect
- `components/auth/protected-route.tsx` - Login redirect

### Styling

All auth pages use the Hybridized brand:

- Purple/pink/blue gradients
- Glassmorphism effects
- Consistent with app design

Customize in individual page files.

### Email Templates

Customize in Supabase Dashboard:

- Authentication > Email Templates
- Modify HTML/text content
- Add your branding
- Set custom redirect URLs

## Troubleshooting

### Email Not Sending

- Check Supabase email settings
- Verify email templates are configured
- Check spam folder
- Use custom SMTP in production

### Session Not Persisting

- Verify middleware is running
- Check cookie settings
- Ensure `NEXT_PUBLIC_SITE_URL` is correct

### Profile Not Created

- Check database trigger exists
- Verify RLS policies
- Check Supabase logs

### Redirect Issues

- Verify all redirect URLs match your domain
- Check `NEXT_PUBLIC_SITE_URL` environment variable
- Update Supabase redirect URL allowlist

## Testing

### Test User Flow

1. Sign up with test email
2. Check email for confirmation
3. Verify profile created in database
4. Test login
5. Test password reset
6. Test profile update
7. Test sign out

### Development

Use Supabase local development:

```bash
npx supabase start
npx supabase db reset
```

## Production Checklist

- [ ] Configure custom SMTP for emails
- [ ] Update redirect URLs to production domain
- [ ] Enable email rate limiting
- [ ] Set up monitoring for auth events
- [ ] Configure password requirements
- [ ] Enable MFA (optional)
- [ ] Set up OAuth providers (optional)
- [ ] Test all auth flows
- [ ] Review RLS policies
- [ ] Enable audit logging

## Additional Features

### OAuth Providers

Add social login in Supabase Dashboard:

- Authentication > Providers
- Enable Google, GitHub, etc.
- Update login page with OAuth buttons

### Multi-Factor Authentication

Enable in Supabase Dashboard:

- Authentication > Settings
- Enable MFA
- Update login flow

### Magic Links

Replace password auth with magic links:

```tsx
const { error } = await supabase.auth.signInWithOtp({
  email: email,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

## Support

For issues or questions:

- Check Supabase documentation
- Review Supabase logs
- Check browser console for errors
- Verify environment variables
