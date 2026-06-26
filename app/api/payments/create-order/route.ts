import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { connectDB } from "@/lib/db";
import { readJson } from "@/lib/http";
import { getAuthIdFromRequest } from "@/lib/auth";
import { detectCountryCode } from "@/lib/geoLocation";
import {
  getExchangeRates,
  getCurrencyForCountry,
  convertFromInrPaise,
  formatCurrency,
} from "@/lib/currency";
import {
  getSelectedPlan,
  getDbPriceMapPaise,
  planPrices,
  programRedirects,
} from "@/lib/payments";

export async function POST(req: NextRequest) {
  const userId = getAuthIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  try {
    const body = await readJson<Record<string, any>>(req);
    const rawProgram = body.program || body.plan || body.planKey;
    const { normalizedProgram, selectedPlan } = getSelectedPlan(rawProgram);

    if (!selectedPlan) {
      return NextResponse.json(
        {
          message: "Invalid payment plan",
          receivedProgram: rawProgram,
          normalizedProgram,
          allowedPlans: Object.keys(planPrices),
        },
        { status: 400 }
      );
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { message: "Razorpay keys missing in server environment" },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const country = await detectCountryCode(req, body.country);
    const currency = getCurrencyForCountry(country);
    const rates = await getExchangeRates();
    await connectDB();
    const dbPrices = await getDbPriceMapPaise();
    const baseAmountPaise = dbPrices[selectedPlan.finalProgram] ?? selectedPlan.amount;
    const converted = convertFromInrPaise(baseAmountPaise, currency, rates);

    const orderNotes = {
      userId,
      program: selectedPlan.finalProgram,
      country,
      baseAmount: String(baseAmountPaise),
      baseCurrency: "INR",
    };

    let order;
    try {
      order = await razorpay.orders.create({
        amount: converted.amount,
        currency,
        receipt: `buddy_${selectedPlan.finalProgram}_${Date.now()}`,
        notes: orderNotes,
      });
    } catch (orderError) {
      if (currency === "INR") {
        throw orderError;
      }
      // Fall back to the base currency if the detected currency isn't supported
      // by the Razorpay account.
      console.warn(
        `Order creation in ${currency} failed, falling back to INR:`,
        (orderError as Error).message
      );
      order = await razorpay.orders.create({
        amount: baseAmountPaise,
        currency: "INR",
        receipt: `buddy_${selectedPlan.finalProgram}_${Date.now()}`,
        notes: { ...orderNotes, fallback: "true" },
      });
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      displayAmount: formatCurrency(Number(order.amount) / 100, order.currency),
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      planTitle: selectedPlan.title,
      program: selectedPlan.finalProgram,
      redirectPath: programRedirects[selectedPlan.finalProgram],
      country,
    });
  } catch (error: any) {
    console.error("CREATE RAZORPAY ORDER ERROR:", error);
    const razorpayError = error?.error?.description || error?.error;
    const msg =
      typeof razorpayError === "string"
        ? razorpayError
        : (error as Error).message || "Failed to create payment order";
    const status = error?.statusCode || 500;
    return NextResponse.json({ message: msg }, { status });
  }
}
