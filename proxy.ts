import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE = "buddyToken";
const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");

// Path prefixes that require an authenticated user. The admin ROLE itself is
// verified server-side in the (admin) layout (a DB lookup, which the Edge
// middleware runtime can't do); here we only confirm a valid session token.
// Plan-gated access (normal-workout/home-workout/etc.) is likewise enforced in
// the page server components — middleware only guarantees authentication.
const PROTECTED_PREFIXES = [
  "/profile",
  "/bmi",
  "/weight",
  "/diet",
  "/store",
  "/product",
  "/workouts",
  "/normal-workout",
  "/home-workout",
  "/personal-training",
  "/daily-workout",
  "/workout-list",
  "/workout-detail",
  "/payment",
  "/razorpay",
  "/admin",
];

function needsAuth(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

async function hasValidToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /admin-login is the public admin sign-in page, not a protected /admin route.
  if (pathname === "/admin-login" || !needsAuth(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (await hasValidToken(token)) {
    return NextResponse.next();
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = pathname.startsWith("/admin") ? "/admin-login" : "/login";
  loginUrl.search = "";
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Run on everything except API routes, Next internals, and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json).*)"],
};
