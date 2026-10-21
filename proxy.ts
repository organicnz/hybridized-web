import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const RATE_LIMIT = 100;
const WINDOW_MS = 60_000;

const ipMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(request: NextRequest): NextResponse {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const record = ipMap.get(ip);

  if (!record || now > record.resetAt) {
    ipMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return withQuota(NextResponse.next(), RATE_LIMIT - 1, now + WINDOW_MS);
  }

  if (record.count >= RATE_LIMIT) {
    return new NextResponse(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": Math.ceil((record.resetAt - now) / 1000).toString(),
      },
    });
  }

  record.count++;
  return withQuota(NextResponse.next(), RATE_LIMIT - record.count, record.resetAt);
}

/**
 * The quota headers, on every answer — including the first one for an
 * address, which is the one a client is most likely to look at.
 */
function withQuota(response: NextResponse, remaining: number, resetAt: number): NextResponse {
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set("X-RateLimit-Reset", Math.ceil(resetAt / 1000).toString());
  return response;
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Per-IP rate limiting for the API.
  if (path.startsWith("/api/")) {
    return rateLimit(request);
  }

  // Session refresh + auth route guards for pages.
  if (!path.startsWith("/api/")) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            for (const { name, value } of cookiesToSet) {
              request.cookies.set(name, value);
            }
            supabaseResponse = NextResponse.next({ request });
            for (const { name, value, options } of cookiesToSet) {
              supabaseResponse.cookies.set(name, value, options);
            }
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const protectedPaths = ["/profile", "/dashboard"];
    const authPaths = ["/auth/login", "/auth/signup"];

    const isProtectedPath = protectedPaths.some((p) => path.startsWith(p));
    const isAuthPath = authPaths.some((p) => path.startsWith(p));

    if (isProtectedPath && !user) {
      const redirectUrl = new URL("/auth/login", request.url);
      redirectUrl.searchParams.set("redirectTo", path);
      return NextResponse.redirect(redirectUrl);
    }

    if (isAuthPath && user) {
      return NextResponse.redirect(new URL("/home", request.url));
    }

    return supabaseResponse;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
