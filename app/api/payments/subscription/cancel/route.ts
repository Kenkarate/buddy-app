import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { readJson } from "@/lib/http";
import { getAuthIdFromRequest } from "@/lib/auth";
import { upsertSubscription } from "@/lib/planManagement";
import { getSelectedPlan, razorpayClient } from "@/lib/payments";

// Cancels a subscription at the end of the current billing cycle. Access remains
// until the already-paid period expires.
export async function POST(req: NextRequest) {
  const userId = getAuthIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  try {
    const body = await readJson<{ program?: string; subscriptionId?: string }>(req);

    await connectDB();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const targetProgram = getSelectedPlan(body.program).selectedPlan?.finalProgram;
    const record = (user.subscriptions || []).find((s: any) => {
      if (body.subscriptionId) return s.razorpaySubscriptionId === body.subscriptionId;
      return s.plan === targetProgram;
    });

    if (!record?.razorpaySubscriptionId) {
      return NextResponse.json(
        { message: "No active subscription found" },
        { status: 404 }
      );
    }

    const razorpay = razorpayClient();
    if (!razorpay) {
      return NextResponse.json(
        { message: "Razorpay keys missing in server environment" },
        { status: 500 }
      );
    }

    // cancel_at_cycle_end keeps access until the paid period ends.
    await razorpay.subscriptions.cancel(record.razorpaySubscriptionId, true);

    upsertSubscription(user, {
      razorpaySubscriptionId: record.razorpaySubscriptionId,
      status: "cancelled",
      cancelledAt: new Date(),
    });
    await user.save();

    const safeUser = await User.findById(userId).select("-password");
    return NextResponse.json({
      success: true,
      message: "Subscription will end at the current billing cycle",
      user: safeUser,
    });
  } catch (error) {
    console.error("CANCEL SUBSCRIPTION ERROR:", error);
    return NextResponse.json(
      { message: (error as Error).message || "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
