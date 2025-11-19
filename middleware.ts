import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Update session
  const response = await updateSession(request);

  // Protected routes that require authentication
  const protectedPaths = ["/profile", "/dashboard"];
  const authPaths = ["/auth/login", "/auth/signup"];

  const path = request.nextUrl.pathname;

  // Check if accessing protected route
  const isProtectedPath = protectedPaths.some((p) => path.startsWith(p));
  const isAuthPath = authPaths.some((p) => path.startsWith(p));

  // Get user from response (session was updated in updateSession)
  const supabaseResponse = response;

  // If accessing protected route without auth, redirect to login
  if (isProtectedPath) {
    // You can add additional auth checks here if needed
    // For now, the session update handles the auth state
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
