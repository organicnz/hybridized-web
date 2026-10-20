#!/usr/bin/env bun
/**
 * Deploy every Supabase edge function with `--no-verify-jwt`.
 *
 * Disabling JWT verification makes the functions authenticate with the
 * custom `FUNCTION_SECRET` header instead of a Supabase JWT.
 */
import { $ } from "bun";

const FUNCTIONS = [
  "sync-firstory",
  "sync-profile-data",
  "generate-band-stats",
  "search-bands",
  "keep-alive-ping",
  "invite-users",
] as const;

for (const fn of FUNCTIONS) {
  console.log(`\n📦 Deploying ${fn}...`);

  const result = await $`supabase functions deploy ${fn} --no-verify-jwt`.nothrow();

  if (result.exitCode !== 0) {
    console.error(`❌ Failed to deploy ${fn}`);
    process.exit(result.exitCode);
  }

  console.log(`✅ ${fn} deployed successfully`);
}

console.log("\n✅ All functions deployed successfully with JWT verification disabled!");
console.log("🔒 Functions now use FUNCTION_SECRET for authorization");
