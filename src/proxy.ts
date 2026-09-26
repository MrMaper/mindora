import { auth } from "@/auth";
import { NextResponse } from "next/server";

/** Auth pages guests may open; logged-in users get redirected away. */
const AUTH_PAGES = ["/login", "/forgot-password", "/reset-password"];

/** Always reachable without a session (APIs + static + marketing). */
const PUBLIC_EXACT = new Set(["/"]);
const PUBLIC_PREFIXES = ["/api/bale/webhook", "/assets", "/fonts"];

export default auth(req => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isAuthPage = AUTH_PAGES.some(
    p => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isPublicExact = PUBLIC_EXACT.has(pathname);
  const isPublicPrefix = PUBLIC_PREFIXES.some(p => pathname.startsWith(p));

  if (!isLoggedIn && !isAuthPage && !isPublicExact && !isPublicPrefix) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isAuthPage) {
    const role = (req.auth as { user?: { role?: string } } | null)?.user?.role;
    return NextResponse.redirect(
      new URL(role === "ADMIN" ? "/users" : "/dashboard", req.nextUrl),
    );
  }

  return NextResponse.next();
});

export const config = {
  // Skip auth gate for Next internals and static files (logo, favicon, fonts, …)
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|txt|webmanifest)$).*)",
  ],
};
