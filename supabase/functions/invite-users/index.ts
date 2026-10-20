import "jsr:@supabase/functions-js@2/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Invite a list of users by email.
 *
 * The list comes from the request body — `{ "emails": ["a@b.c"] }` — so the
 * addresses that are invited are the caller's choice and not a copy baked
 * into the deployed function.
 *
 * Authenticated with `FUNCTION_SECRET`, the same as the other edge functions.
 */

const REDIRECT_TO = "https://hybridized.online/auth/callback";

/** The pause between invites, so the provider's rate limit is not hit. */
const INVITE_DELAY_MS = 1000;

interface InviteBody {
  emails?: unknown;
}

/** The request's email list, if it is a non-empty list of strings. */
function parseEmails(body: InviteBody): string[] | null {
  if (!Array.isArray(body.emails)) return null;

  const emails = body.emails.filter(
    (email): email is string => typeof email === "string" && email.includes("@"),
  );

  return emails.length > 0 ? emails : null;
}

Deno.serve(async (req) => {
  try {
    // Authorization check (fail-closed: missing secret config rejects all requests)
    const authHeader = req.headers.get("Authorization");
    const functionSecret = Deno.env.get("FUNCTION_SECRET");

    if (!functionSecret || authHeader !== `Bearer ${functionSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const emails = parseEmails((await req.json()) as InviteBody);

    if (!emails) {
      return new Response(
        JSON.stringify({ error: 'Expected a body of { "emails": ["someone@example.com"] }' }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: existingUsers, error: fetchError } = await supabase
      .from("users")
      .select("email")
      .in("email", emails);

    if (fetchError) {
      return new Response(
        JSON.stringify({
          error: `Failed to fetch existing users: ${fetchError.message}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const existingEmails = new Set(existingUsers.map((user) => user.email));
    const results = [];

    for (const email of emails) {
      if (existingEmails.has(email)) {
        results.push({
          email,
          status: "skipped",
          details: "User already exists",
        });
        continue;
      }

      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: REDIRECT_TO,
      });

      if (error) {
        results.push({
          email,
          status: "failed",
          details: error.message,
        });
      } else {
        results.push({
          email,
          status: "invited",
          details: data,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, INVITE_DELAY_MS));
    }

    return new Response(
      JSON.stringify({
        message: "Invitation process complete",
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
