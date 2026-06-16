import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { AppError } from "@/lib/apiResponse";

const JWT_SECRET = process.env.JWT_SECRET as string;

export const AUTH_COOKIE = "buddyToken";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days (matches the old JWT expiry)

export interface TokenPayload {
  id: string;
}

export function signToken(userId: string): string {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

// Sets the auth JWT as an httpOnly cookie. Call from a Route Handler or Server
// Action (where the cookie store is writable).
export async function setAuthCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearAuthCookie(): Promise<void> {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
}

// Reads the token from the request: httpOnly cookie first, then a legacy
// `Authorization: Bearer` header (for clients still sending the localStorage
// token during/after the migration window).
export function getTokenFromRequest(req: NextRequest): string | null {
  const cookieToken = req.cookies.get(AUTH_COOKIE)?.value;
  if (cookieToken) return cookieToken;

  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

export function getAuthIdFromRequest(req: NextRequest): string | null {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token)?.id ?? null;
}

// Route-handler guard: returns the authenticated user id or throws AppError(401).
export function requireAuthId(req: NextRequest): string {
  const id = getAuthIdFromRequest(req);
  if (!id) throw new AppError("Not authorized", 401, "UNAUTHORIZED");
  return id;
}

// Route-handler guard: loads and returns the full user document, or throws.
export async function requireUser(req: NextRequest) {
  const id = requireAuthId(req);
  await connectDB();
  const user = await User.findById(id);
  if (!user) throw new AppError("Not authorized", 401, "UNAUTHORIZED");
  return user;
}

// Route-handler guard: ensures the caller is an admin (chain after requireUser
// semantics). Throws AppError(403) otherwise.
export async function requireAdmin(req: NextRequest) {
  const user = await requireUser(req);
  if (user.role !== "admin") {
    throw new AppError("Admin access only", 403, "FORBIDDEN");
  }
  return user;
}

// Server Component / page helper: resolves the current user from the cookie
// (no Authorization header available on document requests). Returns null when
// unauthenticated. Use to gate pages server-side and avoid client flashes.
export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  await connectDB();
  return User.findById(decoded.id);
}
