import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/home";
  const type = requestUrl.searchParams.get("type"); // signup, magiclink, recovery, etc.

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Validate redirect URL to prevent open redirect vulnerability
      const isRelativePath = next.startsWith("/") && !next.startsWith("//");
      const redirectUrl = isRelativePath ? next : "/home";

      // If this is a signup confirmation, redirect to confirmation page
      if (type === "signup") {
        return NextResponse.redirect(
          new URL("/auth/confirm-email?confirmed=true", request.url),
        );
      }

      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  // If there's an error or no code, redirect to login
  return NextResponse.redirect(new URL("/auth/login", request.url));
}
