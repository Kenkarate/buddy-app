const Payment = require("../models/Payment");

const PLAN_KEYS = ["personal-training", "normal-workouts", "home-workout"];

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

// Writes/refreshes a PAID purchase entry on a user document and keeps the legacy
// subscription fields in sync (both access paths — purchasedPlans[] and the
// legacy selectedProgram/subscriptionStatus — must agree). Mutates `user`; the
// caller is responsible for `await user.save()`. Returns the new expiry date.
//
// Shared by the payment verify flow and the admin grant flow so there is a
// single source of truth for what "owning a plan" means.
function grantPlan(user, { plan, durationMonths = 1, amount = 0, currency = "INR", paymentId, orderId, signature } = {}) {
  const now = new Date();
  const expiry = addMonths(now, durationMonths);

  user.purchasedPlans = (user.purchasedPlans || []).filter((p) => p.plan !== plan);
  user.purchasedPlans.push({
    plan,
    paymentStatus: "paid",
    paymentId,
    orderId,
    purchaseDate: now,
    planExpiryDate: expiry,
    amount,
    currency,
  });

  user.selectedProgram = plan;
  user.selectedPlan = plan;
  user.subscriptionStatus = "paid";
  user.paymentStatus = "paid";
  user.subscriptionStartedAt = now;
  user.subscriptionExpiresAt = expiry;

  if (paymentId || orderId) {
    user.lastPayment = {
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: signature,
      program: plan,
      paidAt: now,
    };
  }

  user.markModified("purchasedPlans");
  return expiry;
}

// Pushes out an existing plan's expiry. Extends from the current expiry if still
// in the future, otherwise from now. Returns the new expiry, or null if the user
// has no purchase for that plan.
function extendPlan(user, { plan, addMonths: months = 1 } = {}) {
  const existing = (user.purchasedPlans || []).find((p) => p.plan === plan);
  if (!existing) return null;

  const now = new Date();
  const base =
    existing.planExpiryDate && new Date(existing.planExpiryDate) > now
      ? new Date(existing.planExpiryDate)
      : now;
  const newExpiry = addMonths(base, months);

  existing.planExpiryDate = newExpiry;
  existing.paymentStatus = "paid";

  if (user.selectedProgram === plan) {
    user.subscriptionStatus = "paid";
    user.paymentStatus = "paid";
    user.subscriptionExpiresAt = newExpiry;
  }

  user.markModified("purchasedPlans");
  return newExpiry;
}

// Revokes access to a plan by marking its purchase expired and clearing the
// legacy fields if it was the user's active program. Returns true if a matching
// purchase was found.
function revokePlan(user, { plan } = {}) {
  const existing = (user.purchasedPlans || []).find((p) => p.plan === plan);
  if (existing) {
    existing.planExpiryDate = new Date();
    existing.paymentStatus = "expired";
    user.markModified("purchasedPlans");
  }

  if (user.selectedProgram === plan) {
    user.subscriptionStatus = "expired";
    user.paymentStatus = "expired";
    user.subscriptionExpiresAt = new Date();
  }

  return Boolean(existing);
}

// Creates or updates the user's subscription record for a plan (matched by
// razorpaySubscriptionId, falling back to plan). Mutates `user`; caller saves.
// Access is NOT granted here — that stays with grantPlan/extendPlan.
function upsertSubscription(user, { plan, razorpaySubscriptionId, razorpayPlanId, status, shortUrl, currentStart, currentEnd, cancelledAt } = {}) {
  user.subscriptions = user.subscriptions || [];

  let record =
    user.subscriptions.find((s) => s.razorpaySubscriptionId === razorpaySubscriptionId) ||
    (razorpaySubscriptionId ? null : user.subscriptions.find((s) => s.plan === plan));

  if (!record) {
    record = { plan, razorpaySubscriptionId, createdAt: new Date() };
    user.subscriptions.push(record);
  }

  if (plan !== undefined) record.plan = plan;
  if (razorpaySubscriptionId !== undefined) record.razorpaySubscriptionId = razorpaySubscriptionId;
  if (razorpayPlanId !== undefined) record.razorpayPlanId = razorpayPlanId;
  if (status !== undefined) record.status = status;
  if (shortUrl !== undefined) record.shortUrl = shortUrl;
  if (currentStart !== undefined) record.currentStart = currentStart;
  if (currentEnd !== undefined) record.currentEnd = currentEnd;
  if (cancelledAt !== undefined) record.cancelledAt = cancelledAt;

  user.markModified("subscriptions");
  return record;
}

// Records a Payment document — the single revenue source used by analytics.
// `source` distinguishes real Razorpay payments from admin comps.
async function recordPayment({ userId, plan, amount = 0, currency = "INR", providerPaymentId, source = "razorpay" }) {
  try {
    return await Payment.create({
      userId,
      planKey: plan,
      amount,
      currency,
      status: "paid",
      paidAt: new Date(),
      paymentProvider: source,
      providerPaymentId,
    });
  } catch (error) {
    console.error("RECORD PAYMENT ERROR:", error);
    return null;
  }
}

module.exports = {
  PLAN_KEYS,
  grantPlan,
  extendPlan,
  revokePlan,
  recordPayment,
  upsertSubscription,
};
