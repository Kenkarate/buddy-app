import Razorpay from "razorpay";
import { User } from "@/models/User";
import { PricingPlan } from "@/models/PricingPlan";
import { grantPlan, recordPayment } from "@/lib/planManagement";

export interface PlanPrice {
  title: string;
  amount: number; // INR paise
  finalProgram: string;
}

export const planPrices: Record<string, PlanPrice> = {
  pte: { title: "Personal Training", amount: 99900, finalProgram: "personal-training" },
  "personal-training": { title: "Personal Training", amount: 99900, finalProgram: "personal-training" },
  normal: { title: "Normal Workout", amount: 8000, finalProgram: "normal-workouts" },
  "normal-workout": { title: "Normal Workout", amount: 8000, finalProgram: "normal-workouts" },
  "normal-workouts": { title: "Normal Workout", amount: 8000, finalProgram: "normal-workouts" },
  home: { title: "Home Workout", amount: 15000, finalProgram: "home-workout" },
  "home-workout": { title: "Home Workout", amount: 15000, finalProgram: "home-workout" },
  "home-workouts": { title: "Home Workout", amount: 15000, finalProgram: "home-workout" },
};

export const programRedirects: Record<string, string> = {
  "normal-workouts": "/normal-workout",
  "home-workout": "/home-workout",
  "personal-training": "/personal-training",
};

// Plans billed as auto-renewing Razorpay subscriptions (vs one-time orders).
// Requires the Razorpay Subscriptions addon to be enabled on the account.
// Set to empty if your account only has basic Payments enabled.
export const SUBSCRIPTION_PROGRAMS = new Set<string>([]);

export function razorpayClient(): Razorpay | null {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null;
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// Returns the Razorpay Plan ID for a program's monthly subscription, creating
// (and caching on the PricingPlan row) one on first use. Subscription plans are
// billed in INR (Razorpay plans have a fixed amount/currency, so the per-country
// currency conversion used for one-time orders does not apply here).
export async function getOrCreateRazorpayPlan(
  razorpay: any,
  program: string,
  fallbackPlan: PlanPrice
): Promise<string> {
  let pricing = await PricingPlan.findOne({ planKey: program });

  if (pricing?.razorpayPlanId) {
    return pricing.razorpayPlanId;
  }

  const amountPaise = pricing
    ? Math.round(Number(pricing.baseAmount) * 100)
    : fallbackPlan.amount;
  const title = pricing?.title || fallbackPlan.title;

  const plan = await razorpay.plans.create({
    period: "monthly",
    interval: 1,
    item: { name: `${title} (Monthly)`, amount: amountPaise, currency: "INR" },
    notes: { program },
  });

  if (!pricing) {
    pricing = new PricingPlan({
      planKey: program,
      title,
      baseAmount: amountPaise / 100,
      baseCurrency: "INR",
    });
  }
  pricing.razorpayPlanId = plan.id;
  await pricing.save();

  return plan.id;
}

export function getSelectedPlan(rawProgram: unknown) {
  const normalizedProgram = String(rawProgram || "").trim().toLowerCase();
  return { normalizedProgram, selectedPlan: planPrices[normalizedProgram] };
}

// Admin-editable prices live in the PricingPlan collection (baseAmount in INR
// major units, i.e. rupees). Returns finalProgram(planKey) -> amount in INR paise.
export async function getDbPriceMapPaise(): Promise<Record<string, number>> {
  try {
    const rows = await PricingPlan.find({ isActive: true });
    const map: Record<string, number> = {};
    for (const row of rows) {
      const amount = Number(row.baseAmount);
      if (Number.isFinite(amount)) {
        map[row.planKey] = Math.round(amount * 100);
      }
    }
    return map;
  } catch (error) {
    console.warn(
      "Pricing DB lookup failed, using hardcoded prices:",
      (error as Error).message
    );
    return {};
  }
}

export function hasActivePurchase(user: any, program: string): boolean {
  const now = new Date();
  const activePlan = (user.purchasedPlans || []).some((purchase: any) => {
    const expiry = purchase.planExpiryDate ? new Date(purchase.planExpiryDate) : null;
    return (
      purchase.plan === program &&
      purchase.paymentStatus === "paid" &&
      (!expiry || expiry > now)
    );
  });

  const legacyPaid =
    user.selectedProgram === program &&
    user.subscriptionStatus === "paid" &&
    (!user.subscriptionExpiresAt || new Date(user.subscriptionExpiresAt) > now);

  return activePlan || legacyPaid;
}

export function buildAccessPayload(user: any, program: string) {
  return {
    program,
    purchased: hasActivePurchase(user, program),
    redirectPath: programRedirects[program] || "/workouts",
    paymentPath: `/payment/${program}`,
    user,
  };
}

export async function savePurchasedPlan({
  userId,
  selectedPlan,
  orderId,
  paymentId,
  signature,
  amount,
  currency,
}: {
  userId: string;
  selectedPlan: PlanPrice;
  orderId: string;
  paymentId: string;
  signature: string;
  amount: number;
  currency: string;
}) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Single source of truth for writing a purchase (shared with admin grants).
  grantPlan(user, {
    plan: selectedPlan.finalProgram,
    durationMonths: 1,
    amount,
    currency,
    paymentId,
    orderId,
    signature,
  });

  await user.save();

  // Record the payment so admin revenue analytics have a real source.
  await recordPayment({
    userId,
    plan: selectedPlan.finalProgram,
    amount,
    currency,
    providerPaymentId: paymentId,
    source: "razorpay",
  });

  return User.findById(userId).select("-password");
}
