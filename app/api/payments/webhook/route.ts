import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Payment } from "@/models/Payment";
import { grantPlan, upsertSubscription, revokePlan } from "@/lib/planManagement";

// Razorpay subscription webhook. The signature is computed over the EXACT raw
// request bytes, so we read req.text() and never req.json(). This is the source
// of truth for renewals + revenue; the in-app verify endpoint only grants the
// first cycle for instant UX. Requires the Node.js runtime (crypto + mongoose).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error("RAZORPAY_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { message: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    if (!signature || expected !== signature) {
      return NextResponse.json(
        { message: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(rawBody);
    const sub = event.payload?.subscription?.entity;
    const payment = event.payload?.payment?.entity;

    // Only subscription events carry the notes we need; ignore the rest.
    const userId = sub?.notes?.userId;
    const program = sub?.notes?.program;

    if (!sub || !userId || !program) {
      return NextResponse.json({ received: true, ignored: true });
    }

    await connectDB();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ received: true, userMissing: true });
    }

    const currentEnd = sub.current_end ? new Date(sub.current_end * 1000) : undefined;
    const currentStart = sub.current_start
      ? new Date(sub.current_start * 1000)
      : undefined;

    switch (event.event) {
      case "subscription.charged": {
        // Refresh a full cycle of access (resets the home-workout 30-day window).
        grantPlan(user, {
          plan: program,
          durationMonths: 1,
          amount: payment?.amount,
          currency: payment?.currency,
          paymentId: payment?.id,
          orderId: sub.id,
        });
        upsertSubscription(user, {
          plan: program,
          razorpaySubscriptionId: sub.id,
          razorpayPlanId: sub.plan_id,
          status: sub.status || "active",
          currentStart,
          currentEnd,
        });
        await user.save();

        // Record revenue once per payment (webhooks can be retried).
        if (payment?.id) {
          const already = await Payment.findOne({ providerPaymentId: payment.id });
          if (!already) {
            await Payment.create({
              userId,
              planKey: program,
              amount: payment.amount,
              currency: payment.currency || "INR",
              status: "paid",
              paidAt: new Date(),
              paymentProvider: "razorpay-subscription",
              providerPaymentId: payment.id,
            });
          }
        }
        break;
      }

      case "subscription.activated":
      case "subscription.authenticated":
      case "subscription.pending":
      case "subscription.completed": {
        upsertSubscription(user, {
          plan: program,
          razorpaySubscriptionId: sub.id,
          status: sub.status || event.event.split(".")[1],
          currentStart,
          currentEnd,
        });
        await user.save();
        break;
      }

      case "subscription.cancelled": {
        upsertSubscription(user, {
          razorpaySubscriptionId: sub.id,
          status: "cancelled",
          cancelledAt: new Date(),
        });
        await user.save();
        break;
      }

      case "subscription.halted": {
        // Payment retries exhausted — stop access.
        upsertSubscription(user, { razorpaySubscriptionId: sub.id, status: "halted" });
        revokePlan(user, { plan: program });
        await user.save();
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("RAZORPAY WEBHOOK ERROR:", error);
    return NextResponse.json({ message: "Webhook handler error" }, { status: 500 });
  }
}
