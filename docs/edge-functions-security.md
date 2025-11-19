# Edge Functions Security Configuration

## JWT Verification Issue

**Current Status:** All functions have `verify_jwt: true` enabled in Supabase.

**Problem:** When JWT verification is enabled, the function accepts the easily-obtained anon key, which defeats the purpose of custom authorization.

**Solution:** Disable JWT verification for all functions that implement custom `FUNCTION_SECRET` authorization.

## How to Disable JWT Verification

### Via Supabase Dashboard (Recommended)

For each function:

1. Go to https://supabase.com/dashboard/project/neslxchdtibzhxijxcbg/functions
2. Click on the function name
3. Go to **Settings** tab
4. Find **Verify JWT** toggle
5. Set to **OFF**
6. Save changes

### Functions Requiring This Change

| Function            | Has Custom Auth         | Needs JWT OFF |
| ------------------- | ----------------------- | ------------- |
| sync-firstory       | ✅ FUNCTION_SECRET      | ✅ YES        |
| sync-profile-data   | ✅ FUNCTION_SECRET      | ✅ YES        |
| generate-band-stats | ✅ FUNCTION_SECRET      | ✅ YES        |
| search-bands        | ✅ Public (intentional) | ✅ YES        |
| keep-alive-ping     | ✅ Public (intentional) | ✅ YES        |
| invite-users        | ✅ FUNCTION_SECRET      | ✅ YES        |

## Authorization Implementation

All protected functions now check for `FUNCTION_SECRET`:

```typescript
// Authorization check using custom secret
const authHeader = req.headers.get("Authorization");
const functionSecret = Deno.env.get("FUNCTION_SECRET");

if (functionSecret && authHeader !== `Bearer ${functionSecret}`) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
```

## Why This Matters

**With JWT verification ON:**

- Anyone with the anon key (which is public) can call the function
- Custom authorization is bypassed
- Security is compromised

**With JWT verification OFF + Custom Auth:**

- Only requests with the correct `FUNCTION_SECRET` are accepted
- The secret is private and controlled by you
- Much more secure

## Verification

After disabling JWT verification, test a function:

```bash
# This should fail (no auth)
curl -X POST https://neslxchdtibzhxijxcbg.supabase.co/functions/v1/sync-firstory

# This should succeed
curl -X POST https://neslxchdtibzhxijxcbg.supabase.co/functions/v1/sync-firstory \
  -H "Authorization: Bearer gqHoRwN5AOAXCj64krBdeGIKkgjcTQhaVU2nBVgcMCM="
```

## Summary

✅ All functions deployed with custom authorization code
✅ FUNCTION_SECRET generated and configured
✅ Local config.toml files created (for reference)
⚠️ **Manual action required:** Disable JWT verification in dashboard for each function
