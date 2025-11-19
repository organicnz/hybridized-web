# Edge Functions Setup

## ✅ JWT Verification Disabled

All functions have `verify_jwt: false` set. This ensures they use custom `FUNCTION_SECRET` authorization instead of the easily-obtained anon key.

**Deployment Script:**
Use `scripts/deploy-functions.sh` to deploy all functions with the correct settings:

```bash
./scripts/deploy-functions.sh
```

Or deploy individually:

```bash
supabase functions deploy <function-name> --no-verify-jwt
```

## Deployed Functions

All edge functions have been deployed to Supabase with custom authorization:

### Protected Functions (require FUNCTION_SECRET)

- **sync-firstory** - Syncs RSS feed from Firstory to episodes table
- **sync-profile-data** - Syncs auth users with profiles table
- **generate-band-stats** - Generates statistics about bands

### Public Functions (no auth required)

- **search-bands** - Full-text search for bands
- **keep-alive-ping** - Health check endpoint

## Setting Up FUNCTION_SECRET

### 1. Generate a Secret

```bash
# Generate a secure random secret
openssl rand -base64 32
```

### 2. Add to Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** > **Secrets**
3. Add a new secret:
   - Name: `FUNCTION_SECRET`
   - Value: Your generated secret

### 3. Add to Local Environment

Add to your `.env` file:

```env
FUNCTION_SECRET=your-generated-secret-here
```

## Calling Protected Functions

### From Next.js API Routes

```typescript
const response = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sync-firstory`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FUNCTION_SECRET}`,
      "Content-Type": "application/json",
    },
  },
);
```

### From Command Line

```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/sync-firstory \
  -H "Authorization: Bearer YOUR_FUNCTION_SECRET"
```

## Function Details

### sync-firstory

- **Method**: POST
- **Auth**: Required
- **Purpose**: Fetches RSS feed and syncs episodes with band matching
- **Returns**: Sync statistics (created, updated, matched, errors)

### sync-profile-data

- **Method**: Any
- **Auth**: Required
- **Purpose**: Syncs auth.users with profiles table
- **Returns**: Sync statistics (created, synced)

### generate-band-stats

- **Method**: Any
- **Auth**: Required
- **Purpose**: Generates band statistics
- **Returns**: Stats object (totalBands, bandsWithFormulas, etc.)

### search-bands

- **Method**: GET
- **Auth**: None (public)
- **Query Params**: `q` (required), `limit` (optional, default 10)
- **Purpose**: Search bands by name, description, or formula
- **Returns**: Search results array

### keep-alive-ping

- **Method**: Any
- **Auth**: None (public)
- **Purpose**: Health check for keeping functions warm
- **Returns**: Timestamp message

## Deployment Status

All functions deployed successfully:

- ✅ sync-profile-data (v2)
- ✅ generate-band-stats (v2)
- ✅ search-bands (v2)
- ✅ keep-alive-ping (v2)
- ⚠️ sync-firstory (needs manual deployment via CLI)

## Deployment

**Deploy all functions (recommended):**

```bash
./scripts/deploy-functions.sh
```

**Deploy individual function:**

```bash
supabase functions deploy <function-name> --no-verify-jwt
```

**Important:** Always use the `--no-verify-jwt` flag to ensure custom authorization is used.
