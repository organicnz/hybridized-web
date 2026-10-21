/**
 * The invite request's email list.
 *
 * It is in a module of its own because the entry point calls `Deno.serve` at
 * module scope, so importing it starts a listener and the logic inside it
 * cannot be reached by a test.
 */

/**
 * The request's email list, if it is a non-empty list of strings.
 *
 * The addresses are trimmed, because the list arrives from a text area and
 * a stray space would make the address look like a different one — both to
 * the provider and to the check for an address that already has an account.
 */
export function parseEmails(body: { emails?: unknown }): string[] | null {
  if (!Array.isArray(body.emails)) return null;

  const emails = body.emails
    .filter((email): email is string => typeof email === "string")
    .map((email) => email.trim())
    .filter((email) => email.includes("@"));

  return emails.length > 0 ? emails : null;
}
