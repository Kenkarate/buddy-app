import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

// Clears the httpOnly auth cookie. New in the Next.js migration (the old SPA
// just dropped the localStorage token client-side).
export async function POST() {
  await clearAuthCookie();
  return NextResponse.json({ message: "Logged out" });
}
