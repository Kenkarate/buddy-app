import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthIdFromRequest } from "@/lib/auth";
import { detectCountryCode } from "@/lib/geoLocation";
import {
  SUPPORTED_CURRENCIES,
  getExchangeRates,
  getCurrencyForCountry,
  convertFromInrPaise,
  formatCurrency,
} from "@/lib/currency";
import { PricingPlan } from "@/models/PricingPlan";
import { planPrices, getDbPriceMapPaise, SUBSCRIPTION_PROGRAMS } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = getAuthIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  try {
    const country = await detectCountryCode(
      req,
      req.nextUrl.searchParams.get("country") || undefined
    );
    const currency = getCurrencyForCountry(country);
    const rates = await getExchangeRates();
    await connectDB();
    const [dbPrices, pricingRows] = await Promise.all([
      getDbPriceMapPaise(),
      PricingPlan.find({ isActive: true }).select("planKey monthly").lean(),
    ]);

    // Build billing mode map from DB; fall back to hardcoded SUBSCRIPTION_PROGRAMS.
    const billingModes: Record<string, "subscription" | "one-time"> = {};
    const dbMonthlyMap = new Map(
      (pricingRows as { planKey: string; monthly?: boolean }[]).map((r) => [r.planKey, r.monthly])
    );
    const seenPrograms = new Set<string>();
    for (const plan of Object.values(planPrices)) {
      if (seenPrograms.has(plan.finalProgram)) continue;
      seenPrograms.add(plan.finalProgram);
      const monthly = dbMonthlyMap.has(plan.finalProgram)
        ? dbMonthlyMap.get(plan.finalProgram) !== false
        : SUBSCRIPTION_PROGRAMS.has(plan.finalProgram);
      billingModes[plan.finalProgram] = monthly ? "subscription" : "one-time";
    }

    const prices: Record<string, unknown> = {};
    seenPrograms.clear();

    for (const plan of Object.values(planPrices)) {
      if (seenPrograms.has(plan.finalProgram)) continue;
      seenPrograms.add(plan.finalProgram);

      const baseAmount = dbPrices[plan.finalProgram] ?? plan.amount;
      const converted = convertFromInrPaise(baseAmount, currency, rates);

      prices[plan.finalProgram] = {
        title: plan.title,
        amount: converted.amount,
        displayAmount: converted.displayAmount,
        formatted: formatCurrency(converted.displayAmount, currency),
      };
    }

    return NextResponse.json({
      country,
      currency,
      symbol: SUPPORTED_CURRENCIES[currency]?.symbol || currency,
      prices,
      billingModes,
    });
  } catch (error) {
    console.error("CURRENCY DETECTION ERROR:", error);

    const prices: Record<string, unknown> = {};
    const seenPrograms = new Set<string>();

    for (const plan of Object.values(planPrices)) {
      if (seenPrograms.has(plan.finalProgram)) continue;
      seenPrograms.add(plan.finalProgram);

      prices[plan.finalProgram] = {
        title: plan.title,
        amount: plan.amount,
        displayAmount: plan.amount / 100,
        formatted: formatCurrency(plan.amount / 100, "INR"),
      };
    }

    return NextResponse.json({
      country: "IN",
      currency: "INR",
      symbol: SUPPORTED_CURRENCIES.INR.symbol,
      prices,
      fallback: true,
    });
  }
}
