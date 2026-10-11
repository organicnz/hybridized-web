import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const RATE_LIMIT = 100;
const WINDOW_MS = 60_000;

const ipMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(request: NextRequest): NextResponse | null {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const record = ipMap.get(ip);

  if (!record || now > record.resetAt) {
    ipMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return null;
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
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Remaining", (RATE_LIMIT - record.count).toString());
  response.headers.set("X-RateLimit-Reset", Math.ceil(record.resetAt / 1000).toString());
  return response;
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Per-IP rate limiting for the API.
  if (path.startsWith("/api/")) {
    const limited = rateLimit(request);
    if (limited) return limited;
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
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};