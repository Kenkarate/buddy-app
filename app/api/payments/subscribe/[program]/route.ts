import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { PricingPlan } from "@/models/PricingPlan";
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
  console.log(userId);
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

    await connectDB();

    // Check DB billing mode; fall back to hardcoded set for unseeded plans.
    const pricingRow = await PricingPlan.findOne({ planKey: program }).select("monthly").lean() as { monthly?: boolean } | null;
    const isSubscription = pricingRow
      ? pricingRow.monthly !== false
      : SUBSCRIPTION_PROGRAMS.has(program);

    if (!isSubscription) {
      return NextResponse.json(
        { message: "This plan is configured for one-time payment, not subscription" },
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
  } catch (error: any) {
    console.error("CREATE SUBSCRIPTION ERROR:", error);

    // Surface Razorpay API errors (e.g. 401 Unauthorized, invalid plan) so the
    // client and logs show the real cause, not just "Failed to start subscription".
    const razorpayError = error?.error?.description || error?.error;
    const msg =
      typeof razorpayError === "string"
        ? razorpayError
        : (error as Error).message || "Failed to start subscription";
    const status = error?.statusCode || 500;

    return NextResponse.json({ message: msg }, { status });
  }
}
