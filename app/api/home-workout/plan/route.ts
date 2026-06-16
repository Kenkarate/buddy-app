import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { HomeWorkoutDay } from "@/models/HomeWorkoutDay";
import { User } from "@/models/User";
import { getAuthIdFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

const PLAN = "home-workout";

// Resolves the user's home-workout start (= their payment date) and expiry so
// the client can compute the 24h-per-day unlock progression. Returns nulls when
// the user has no active home-workout purchase.
function resolveWindow(user: any) {
  const now = new Date();

  const purchase = (user.purchasedPlans || [])
    .filter((p: any) => p.plan === PLAN && p.paymentStatus === "paid")
    .sort(
      (a: any, b: any) =>
        new Date(b.purchaseDate || 0).getTime() -
        new Date(a.purchaseDate || 0).getTime()
    )[0];

  if (purchase) {
    const expiry = purchase.planExpiryDate
      ? new Date(purchase.planExpiryDate)
      : null;
    return {
      startDate: purchase.purchaseDate || null,
      expiryDate: purchase.planExpiryDate || null,
      hasAccess: !expiry || expiry > now,
    };
  }

  // Legacy fallback: selectedProgram + subscription dates.
  if (user.selectedProgram === PLAN && user.subscriptionStatus === "paid") {
    const expiry = user.subscriptionExpiresAt
      ? new Date(user.subscriptionExpiresAt)
      : null;
    return {
      startDate: user.subscriptionStartedAt || null,
      expiryDate: user.subscriptionExpiresAt || null,
      hasAccess: !expiry || expiry > now,
    };
  }

  return { startDate: null, expiryDate: null, hasAccess: false };
}

// Returns the full 30-day program plus this user's unlock window.
export async function GET(req: NextRequest) {
  const userId = getAuthIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const [days, user] = await Promise.all([
      HomeWorkoutDay.find().sort({ day: 1 }),
      User.findById(userId).select(
        "purchasedPlans selectedProgram subscriptionStatus subscriptionStartedAt subscriptionExpiresAt"
      ),
    ]);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const window = resolveWindow(user);
    return NextResponse.json({ ...window, days });
  } catch (error) {
    console.error("HOME WORKOUT PLAN ERROR:", error);
    return NextResponse.json(
      { message: "Failed to load home workout plan" },
      { status: 500 }
    );
  }
}
