# Magic Link Authentication

## Overview

Users can now sign in using passwordless magic links sent to their email, providing a more convenient and secure authentication method.

## Features

### Login Page

- **Toggle between Password and Magic Link**: Users can switch between traditional password login and magic link authentication
- **Visual feedback**: Clear success message when magic link is sent
- **Email-only flow**: Magic link only requires email address

### How It Works

1. User enters their email address
2. Clicks "Send Magic Link" button
3. Receives an email with a secure one-time link
4. Clicks the link in their email
5. Automatically signed in and redirected to the app

## Implementation Details

### Login Page (`app/auth/login/page.tsx`)

- Added `useMagicLink` state to toggle between auth methods
- Added `magicLinkSent` state to show success message
- Implemented `handleMagicLink()` function using `supabase.auth.signInWithOtp()`
- UI includes toggle buttons with icons (Lock for password, Sparkles for magic link)

### Auth Callback (`app/auth/callback/route.ts`)

- Updated to handle `next` query parameter for flexible redirects
- Exchanges the magic link code for a session
- Redirects user to specified page (default: `/home`)

### Magic Link Configuration

```typescript
await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback?next=${REDIRECT_AFTER_LOGIN}`,
  },
});
```

## User Experience

### Success State

When magic link is sent:

- Green success banner appears
- Shows "Magic link sent!" message
- Instructs user to check email
- Submit button is disabled to prevent duplicate sends

### Error Handling

- Network errors are caught and displayed
- Invalid email addresses are validated
- Clear error messages in red banner

## Security Benefits

1. **No password storage**: Users don't need to remember passwords
2. **One-time use**: Each magic link can only be used once
3. **Time-limited**: Links expire after a set period
4. **Email verification**: Confirms user has access to the email address

## Supabase Configuration

Ensure your Supabase project has:

- Email authentication enabled
- Email templates configured
- Redirect URLs whitelisted in Supabase dashboard:
  - `http://localhost:3000/auth/callback` (development)
  - `https://yourdomain.com/auth/callback` (production)

## Future Enhancements

Potential improvements:

- SMS magic links for phone authentication
- Social OAuth providers (Google, GitHub, etc.)
- Remember device option to reduce login frequency
- Custom email templates with branding
