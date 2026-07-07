import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { readJson } from "@/lib/http";
import { getAuthIdFromRequest } from "@/lib/auth";
import { getSelectedPlan, savePurchasedPlan, programRedirects } from "@/lib/payments";

export async function POST(req: NextRequest) {
  const userId = getAuthIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await readJson<Record<string, string>>(req);

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { message: "Payment verification data missing" },
        { status: 400 }
      );
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { message: "Razorpay keys missing in server environment" },
        { status: 500 }
      );
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { message: "Payment verification failed" },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Pull the authoritative order from Razorpay. The plan, amount and currency
    // come from the order notes we set at creation — never client-supplied values.
    const order = await razorpay.orders.fetch(razorpay_order_id);

    // The order must belong to the authenticated user, otherwise a leaked
    // order/payment/signature triple could be replayed on another account.
    if (String(order.notes?.userId || "") !== String(userId)) {
      return NextResponse.json(
        { message: "This payment does not belong to your account" },
        { status: 403 }
      );
    }

    // Reject orders that were never paid against.
    if (order.status === "created") {
      return NextResponse.json(
        { message: "Payment has not been completed" },
        { status: 400 }
      );
    }

    const { selectedPlan } = getSelectedPlan(order.notes?.program);
    if (!selectedPlan) {
      return NextResponse.json({ message: "Invalid payment plan" }, { status: 400 });
    }

    await connectDB();
    const user = await savePurchasedPlan({
      userId,
      selectedPlan,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      amount: Number(order.amount),
      currency: order.currency,
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      program: selectedPlan.finalProgram,
      redirectPath: programRedirects[selectedPlan.finalProgram],
      user,
    });
  } catch (error) {
    console.error("VERIFY PAYMENT ERROR:", error);
    return NextResponse.json(
      { message: (error as Error).message || "Payment verification failed" },
      { status: 500 }
    );
  }
}
