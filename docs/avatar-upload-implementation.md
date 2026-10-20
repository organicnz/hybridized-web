# Avatar Upload Implementation

## Features Implemented

### 1. Image Compression (`lib/utils/image-compression.ts`)

- Resizes images to max 400x400px (maintains aspect ratio)
- Compresses to JPEG at 85% quality
- Validates file type (JPEG, PNG, WebP)
- Validates file size (max 5MB)

### 2. Profile Page Avatar Upload

**Location:** `app/profile/page.tsx`

**Features:**

- Avatar preview with camera icon overlay
- Click camera icon to select file
- Automatic image compression before upload
- Upload to `avatars/{user_id}/avatar.jpg`
- Updates profile with public URL
- Loading state during upload
- Error handling with user feedback
- Success notification

**Cache Busting:**

- Adds timestamp query parameter to avatar URLs
- Prevents browser from showing cached old images
- Ensures latest avatar is always displayed

### 3. Header Avatar Display

**Location:** `components/header.tsx`

**Features:**

- Shows user avatar when logged in (if exists)
- Falls back to User icon if no avatar
- 40x40px rounded image
- Uses `unoptimized` prop to prevent Next.js caching issues
- Key prop based on URL for React re-render

### 4. Storage Policies

**Bucket:** `avatars` (public)

**Policies Created:**

```sql
-- Users can upload to their own folder
CREATE POLICY "Users can upload to their own avatar folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

-- Users can update their own avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);

-- Public read access
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

## File Structure

```
avatars/
  {user_uuid}/
    avatar.jpg  (compressed, max 400x400px)
```

## Security

- ✅ Users can only upload to their own folder (`{user_id}/`)
- ✅ Users can only update their own avatars
- ✅ Public read access for all avatars
- ✅ File validation (type and size)
- ✅ Image compression reduces storage costs

## User Flow

1. User clicks camera icon on profile page
2. Selects image file (JPEG, PNG, or WebP)
3. Image is validated and compressed
4. Uploaded to `avatars/{user_id}/avatar.jpg`
5. Profile updated with public URL
6. Avatar immediately visible on profile page
7. Avatar appears in header after page refresh
8. Cache-busting ensures latest image is shown

## Technical Details

- Uses `upsert: true` to replace existing avatar
- Stores base URL in database (without timestamp)
- Adds timestamp for display to prevent caching
- Next.js Image component configured for Supabase domain
- `unoptimized` prop prevents Next.js image optimization caching
