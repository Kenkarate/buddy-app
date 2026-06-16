import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getAuthIdFromRequest } from "@/lib/auth";
import { upsertSubscription } from "@/lib/planManagement";
import {
  getSelectedPlan,
  razorpayClient,
  getOrCreateRazorpayPlan,
  SUBSCRIPTION_PROGRAMS,
  programRedirects,
} from "@/lib/payments";

// Creates a Razorpay subscription and returns the data the checkout needs.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ program: string }> }
) {
  const userId = getAuthIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  try {
    const { program: programParam } = await params;
    const { normalizedProgram, selectedPlan } = getSelectedPlan(programParam);

    if (!selectedPlan) {
      return NextResponse.json(
        { message: "Invalid plan", normalizedProgram },
        { status: 400 }
      );
    }

    const program = selectedPlan.finalProgram;
    if (!SUBSCRIPTION_PROGRAMS.has(program)) {
      return NextResponse.json(
        { message: "This plan is not available as a subscription" },
        { status: 400 }
      );
    }

    const razorpay = razorpayClient();
    if (!razorpay) {
      return NextResponse.json(
        { message: "Razorpay keys missing in server environment" },
        { status: 500 }
      );
    }

    await connectDB();
    const planId = await getOrCreateRazorpayPlan(razorpay, program, selectedPlan);

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      // 12 monthly cycles (~1 year) before Razorpay marks it completed.
      total_count: 12,
      notes: { userId, program },
    });

    const user = await User.findById(userId);
    if (user) {
      upsertSubscription(user, {
        plan: program,
        razorpaySubscriptionId: subscription.id,
        razorpayPlanId: planId,
        status: subscription.status || "created",
        shortUrl: subscription.short_url,
      });
      user.selectedProgram = program;
      user.selectedPlan = program;
      await user.save();
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      planTitle: selectedPlan.title,
      program,
      shortUrl: subscription.short_url,
      redirectPath: programRedirects[program],
    });
  } catch (error) {
    console.error("CREATE SUBSCRIPTION ERROR:", error);
    return NextResponse.json(
      { message: (error as Error).message || "Failed to start subscription" },
      { status: 500 }
    );
  }
}
