#!/usr/bin/env bun
/**
 * Put the edge functions' secret where the scheduled jobs can read it.
 *
 * The edge functions authenticate with a shared secret: the caller sends
 * `Authorization: Bearer <FUNCTION_SECRET>` and the function compares it with
 * its own `Deno.env.get("FUNCTION_SECRET")`. The scheduled jobs in the
 * database are the callers, and the database had nowhere to read the secret
 * from — so three of them had been failing for months.
 *
 * The secret now lives in the vault, which is Supabase's own store for it:
 *
 *   vault.secrets           — one row, named `function_secret`
 *   app_private.function_secret()  — reads it, and fails loudly when it is
 *                                     missing, so a gap is visible in the job
 *                                     log rather than in a 401 nobody reads
 *
 * Two modes:
 *
 *   bun scripts/set-function-secret.ts            put the current secret in
 *                                                the vault
 *   bun scripts/set-function-secret.ts --rotate   generate a new one, set it
 *                                                on the live functions and in
 *                                                the vault, and update .env
 *
 * The secret is never printed. The script talks to the Supabase management
 * API with an access token, so it needs:
 *
 *   SUPABASE_ACCESS_TOKEN   a personal access token for the organisation
 *   SUPABASE_PROJECT_REF    the project, if it is not the one below
 *
 * The token can come from the environment or from the file the credentials
 * live in — `~/.ssh/supabase_organicnz_token` — because that is where the
 * machine keeps them.
 */
import { existsSync } from "bun:fs";
import { join } from "bun:path";

const PROJECT_REF = Bun.env.SUPABASE_PROJECT_REF ?? "neslxchdtibzhxijxcbg";
const API = "https://api.supabase.com/v1";
const FUNCTIONS = `https://${PROJECT_REF}.supabase.co/functions/v1`;
const QUERY = `${API}/projects/${PROJECT_REF}/database/query`;

/** The name the secret has in the vault, and in the function's environment. */
const SECRET_NAME = "function_secret";

/** The function the verification calls. It is the read-only one. */
const VERIFY_FUNCTION = "generate-band-stats";

/** Where the credentials live, if they are not in the environment. */
const TOKEN_FILES = [
  join(Bun.env.HOME ?? "", ".ssh", "supabase_organicnz_token"),
  join(Bun.env.HOME ?? "", ".supabase", "access-token"),
];

/**
 * The access token, from the environment or from the file the machine keeps
 * it in.
 *
 * The first one the API accepts is the one that is used. A revoked token is
 * refused with "Invalid access token", and a machine can easily have one in
 * its environment: the environment wins over the file, and the file is
 * usually the one that was rotated.
 */
async function accessToken(): Promise<{ token: string; source: string }> {
  const candidates: { token: string; source: string }[] = [];

  const fromEnv = Bun.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (fromEnv) candidates.push({ token: fromEnv, source: "SUPABASE_ACCESS_TOKEN" });

  for (const path of TOKEN_FILES) {
    if (!existsSync(path)) continue;
    const value = (await Bun.file(path).text()).trim();
    if (value) candidates.push({ token: value, source: path });
  }

  if (candidates.length === 0) {
    throw new Error(`No access token. Set SUPABASE_ACCESS_TOKEN, or put one in ${TOKEN_FILES[0]}.`);
  }

  for (const candidate of candidates) {
    if (await accepted(candidate.token)) return candidate;
    console.log(`  · ${candidate.source} was refused`);
  }

  throw new Error(
    "None of the credentials on this machine is accepted by Supabase. The one in " +
      "the environment may be a token that was rotated; the file is usually the " +
      "current one.",
  );
}

/** Whether the management API accepts a token. */
async function accepted(candidate: string): Promise<boolean> {
  const response = await fetch(`${API}/projects/${PROJECT_REF}/secrets`, {
    headers: { Authorization: `Bearer ${candidate}` },
  });
  return response.ok;
}

/** The token, for the management API. */
let token = "";

/** Run a statement against the database, as the project owner. */
async function sql(statement: string): Promise<unknown> {
  const response = await fetch(QUERY, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: statement }),
  });

  const body = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    const message =
      typeof body === "object" && body !== null && "message" in body
        ? String((body as { message: unknown }).message)
        : response.statusText;
    throw new Error(`the database refused the statement: ${message}`);
  }

  return body;
}

/** The rows a statement returned. */
function rows(body: unknown): Record<string, unknown>[] {
  return Array.isArray(body) ? (body as Record<string, unknown>[]) : [];
}

/**
 * The secret, as the live function understands it.
 *
 * The value in the project's `.env` is what the *running* function accepts.
 * The platform's own copy of the secret can be a different value — it was
 * changed after the functions were last deployed, and a running function
 * keeps the environment it started with — so the value is checked against
 * the function before it is used for anything.
 */
async function currentSecret(): Promise<string> {
  const fromEnv = Bun.env.FUNCTION_SECRET?.trim();
  if (fromEnv) return fromEnv;

  const envFile = join(import.meta.dir, "..", ".env");
  if (existsSync(envFile)) {
    const text = await Bun.file(envFile).text();
    const line = text.split("\n").find((l) => l.startsWith("FUNCTION_SECRET="));
    if (line) return line.slice("FUNCTION_SECRET=".length).trim();
  }

  throw new Error("No secret to work with. Set FUNCTION_SECRET, or put one in the project's .env.");
}

/**
 * Whether the live function accepts a value.
 *
 * The function answers 401 for a value it does not know, and 200 for one it
 * does. Anything else — a 500, a timeout — is not an answer about the secret,
 * so it counts as "not accepted" and the script says so.
 */
async function accepts(secret: string): Promise<boolean> {
  const response = await fetch(`${FUNCTIONS}/${VERIFY_FUNCTION}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  return response.status === 200;
}

/**
 * A value as a SQL string literal.
 *
 * The management API's query endpoint takes a statement and no parameters,
 * so the value has to travel inside it. Quoting is doubled, which is how
 * Postgres escapes a quote, and a null byte is refused because it cannot
 * appear in a statement at all.
 */
function literal(value: string): string {
  if (value.includes("\0")) throw new Error("the secret contains a null byte");
  return `'${value.replace(/'/g, "''")}'`;
}

/** Put the secret in the vault, replacing whatever was there. */
async function storeInVault(secret: string): Promise<void> {
  // The vault keeps one row per name, so the old one goes first. The two
  // statements are separate because the delete has to be visible to the
  // insert, and a data-modifying clause in the same statement is not.
  await sql(`delete from vault.secrets where name = ${literal(SECRET_NAME)}`);

  await sql(
    `select vault.create_secret(
       ${literal(secret)},
       ${literal(SECRET_NAME)},
       'The shared secret the edge functions authenticate with, read by app_private.function_secret()'
     )`,
  );
}

/** Whether the vault holds the secret. */
async function vaultHasSecret(): Promise<boolean> {
  const body = await sql(
    `select count(*)::int as count from vault.decrypted_secrets where name = '${SECRET_NAME}'`,
  );
  return Number(rows(body)[0]?.count ?? 0) > 0;
}

/**
 * Run one of the scheduled jobs, by hand, and say what the function
 * answered.
 *
 * This is the end of the chain: the job's own command, the same statement the
 * migration puts in `cron.job`, run against the live database. The response
 * is recorded in `net._http_response`, which is where the answer shows up.
 */
async function runJobNow(): Promise<number | null> {
  const body = await sql(`
    select net.http_post(
      url := 'https://${PROJECT_REF}.supabase.co/functions/v1/sync-firstory',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || app_private.function_secret()
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    ) as request_id;
  `);

  // The request id is the id of the row the answer lands in.
  const requestId = Number(rows(body)[0]?.request_id ?? 0);
  if (!requestId) return null;

  // The request is asynchronous: the database queues it and records the
  // answer when it lands. The sync takes a few seconds.
  for (let attempt = 0; attempt < 30; attempt++) {
    await Bun.sleep(1000);

    const answer = await sql(
      `select status_code, error_msg from net._http_response where id = ${requestId}`,
    );

    const row = rows(answer)[0];
    if (!row) continue;

    if (row.error_msg) {
      const reported =
        typeof row.error_msg === "string" ? row.error_msg : JSON.stringify(row.error_msg);
      console.error(`  · the request reported: ${reported}`);
      return null;
    }

    if (row.status_code !== null && row.status_code !== undefined) {
      return Number(row.status_code);
    }
  }

  return null;
}

/** A fresh secret: 32 bytes of entropy, hex. */
function generateSecret(): string {
  return Array.from(new Uint8Array(32))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** Write the secret into the project's `.env`, in place. */
async function writeToEnvFile(secret: string): Promise<void> {
  const path = join(import.meta.dir, "..", ".env");
  if (!existsSync(path)) {
    console.log("  · no .env to update");
    return;
  }

  const text = await Bun.file(path).text();
  const updated = text
    .split("\n")
    .map((line) => (line.startsWith("FUNCTION_SECRET=") ? `FUNCTION_SECRET=${secret}` : line))
    .join("\n");

  await Bun.write(path, updated);
  console.log("  ✓ the project's .env has the new secret");
}

/**
 * Set the secret on the live functions.
 *
 * The management API answers with the *hash* of a secret rather than the
 * secret, so the value cannot be read back — only checked, by calling the
 * function with it.
 */
async function setOnFunctions(secret: string): Promise<void> {
  const response = await fetch(`${API}/projects/${PROJECT_REF}/secrets`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "FUNCTION_SECRET", value: secret }),
  });

  if (!response.ok) {
    throw new Error(`the project refused the secret: ${response.statusText}`);
  }
}

const rotate = process.argv.includes("--rotate");

console.log(`▸ project ${PROJECT_REF}`);

const credential = await accessToken();
token = credential.token;
console.log(`  · using the credential from ${credential.source}`);

let secret = await currentSecret();

if (rotate) {
  console.log("▸ generating a new secret");
  secret = generateSecret();

  // The platform's copy is set first: the function reads its environment
  // from the platform, so the new value has to be there before anything is
  // asked to use it.
  await setOnFunctions(secret);
  console.log("  ✓ the live functions have the new secret");

  await writeToEnvFile(secret);
} else {
  const known = await accepts(secret);
  if (!known) {
    console.error(
      "✗ the live function does not accept this secret, so it is not the one the\n" +
        "  functions are running with. Nothing was changed.\n" +
        "  Run with --rotate to set a new secret everywhere.",
    );
    process.exit(1);
  }
  console.log("  ✓ the live function accepts this secret");
}

await storeInVault(secret);
console.log("  ✓ the vault has the secret");

if (!(await vaultHasSecret())) {
  console.error("✗ the vault does not have the secret after writing it.");
  process.exit(1);
}
console.log("  ✓ the vault reads it back");

const status = await runJobNow();
if (status === null) {
  console.error("✗ the job ran but nothing answered. Check the function's logs.");
  process.exit(1);
}
if (status !== 200) {
  console.error(`✗ the job's request was answered with ${status}.`);
  process.exit(1);
}

console.log("\n✓ the scheduled job's own request was answered with 200");
