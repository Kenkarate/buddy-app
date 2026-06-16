import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { readJson } from "@/lib/http";
import { getAuthIdFromRequest } from "@/lib/auth";
import { grantPlan, upsertSubscription } from "@/lib/planManagement";
import { getSelectedPlan, razorpayClient, programRedirects } from "@/lib/payments";

// Verifies the subscription checkout handshake and grants access immediately so
// the UX is instant. Revenue + renewals are recorded by the webhook.
export async function POST(req: NextRequest) {
  const userId = getAuthIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  try {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } =
      await readJson<Record<string, string>>(req);

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return NextResponse.json(
        { message: "Subscription verification data missing" },
        { status: 400 }
      );
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { message: "Razorpay keys missing in server environment" },
        { status: 500 }
      );
    }

    // For subscriptions the signature is HMAC(payment_id + "|" + subscription_id).
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { message: "Subscription verification failed" },
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
    const subscription = await razorpay.subscriptions.fetch(razorpay_subscription_id);

    if (String(subscription.notes?.userId || "") !== String(userId)) {
      return NextResponse.json(
        { message: "This subscription does not belong to your account" },
        { status: 403 }
      );
    }

    const { selectedPlan } = getSelectedPlan(subscription.notes?.program);
    if (!selectedPlan) {
      return NextResponse.json(
        { message: "Invalid subscription plan" },
        { status: 400 }
      );
    }

    const program = selectedPlan.finalProgram;
    await connectDB();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Grant the first billing cycle of access (resets the home-workout 30-day
    // unlock window each cycle). Renewals refresh this from the webhook.
    grantPlan(user, {
      plan: program,
      durationMonths: 1,
      paymentId: razorpay_payment_id,
      orderId: razorpay_subscription_id,
      signature: razorpay_signature,
    });

    upsertSubscription(user, {
      plan: program,
      razorpaySubscriptionId: subscription.id,
      razorpayPlanId: subscription.plan_id,
      status: subscription.status || "active",
      shortUrl: subscription.short_url,
      currentStart: subscription.current_start
        ? new Date(subscription.current_start * 1000)
        : undefined,
      currentEnd: subscription.current_end
        ? new Date(subscription.current_end * 1000)
        : undefined,
    });

    await user.save();

    const safeUser = await User.findById(userId).select("-password");
    return NextResponse.json({
      success: true,
      message: "Subscription active",
      program,
      redirectPath: programRedirects[program],
      user: safeUser,
    });
  } catch (error) {
    console.error("VERIFY SUBSCRIPTION ERROR:", error);
    return NextResponse.json(
      { message: (error as Error).message || "Subscription verification failed" },
      { status: 500 }
    );
  }
}
