const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const protect = require("../middleware/authMiddleware");
const User = require("../models/User");
const { detectCountryCode } = require("../utils/geoLocation");
const { grantPlan, recordPayment, upsertSubscription } = require("../utils/planManagement");
const PricingPlan = require("../models/PricingPlan");
const {
  SUPPORTED_CURRENCIES,
  getExchangeRates,
  getCurrencyForCountry,
  convertFromInrPaise,
  formatCurrency,
} = require("../utils/currency");

const router = express.Router();

const planPrices = {
  pte: {
    title: "Personal Training",
    amount: 99900, // ₹999 in paise
    finalProgram: "personal-training",
  },
  "personal-training": {
    title: "Personal Training",
    amount: 99900,
    finalProgram: "personal-training",
  },
  normal: {
    title: "Normal Workout",
    amount: 8000, // ₹80 in paise
    finalProgram: "normal-workouts",
  },
  "normal-workout": {
    title: "Normal Workout",
    amount: 8000,
    finalProgram: "normal-workouts",
  },
  "normal-workouts": {
    title: "Normal Workout",
    amount: 8000,
    finalProgram: "normal-workouts",
  },
  home: {
    title: "Home Workout",
    amount: 15000, // ₹150 in paise
    finalProgram: "home-workout",
  },
  "home-workout": {
    title: "Home Workout",
    amount: 15000,
    finalProgram: "home-workout",
  },
  "home-workouts": {
    title: "Home Workout",
    amount: 15000,
    finalProgram: "home-workout",
  },
};

const programRedirects = {
  "normal-workouts": "/normal-workout",
  "home-workout": "/home-workout",
  "personal-training": "/personal-training",
};

// Plans billed as auto-renewing Razorpay subscriptions (vs one-time orders).
const SUBSCRIPTION_PROGRAMS = new Set(["home-workout", "normal-workouts"]);

function razorpayClient() {
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
async function getOrCreateRazorpayPlan(razorpay, program, fallbackPlan) {
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
    item: {
      name: `${title} (Monthly)`,
      amount: amountPaise,
      currency: "INR",
    },
    notes: { program },
  });

  // Cache the plan id so we don't create duplicate Razorpay plans on every
  // subscribe. Upsert a PricingPlan row if one doesn't exist yet.
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

function parseBody(body) {
  if (!body) return {};

  if (body.type === "Buffer" && Array.isArray(body.data)) {
    return JSON.parse(Buffer.from(body.data).toString("utf8"));
  }

  if (Buffer.isBuffer(body)) {
    return JSON.parse(body.toString("utf8"));
  }

  if (typeof body === "string") {
    return JSON.parse(body);
  }

  return body;
}

function getSelectedPlan(rawProgram) {
  const normalizedProgram = String(rawProgram || "")
    .trim()
    .toLowerCase();

  return {
    normalizedProgram,
    selectedPlan: planPrices[normalizedProgram],
  };
}

// Admin-editable prices live in the PricingPlan collection (baseAmount in INR
// major units, i.e. rupees). This returns a map of finalProgram -> amount in
// INR paise so it slots into the existing INR-paise conversion logic. Plans not
// present in the DB fall back to the hardcoded planPrices map.
async function getDbPriceMapPaise() {
  try {
    const rows = await PricingPlan.find({ isActive: true });
    const map = {};
    for (const row of rows) {
      const amount = Number(row.baseAmount);
      if (Number.isFinite(amount)) {
        map[row.planKey] = Math.round(amount * 100);
      }
    }
    return map;
  } catch (error) {
    console.warn("Pricing DB lookup failed, using hardcoded prices:", error.message);
    return {};
  }
}

function hasActivePurchase(user, program) {
  const now = new Date();
  const activePlan = (user.purchasedPlans || []).some((purchase) => {
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

function buildAccessPayload(user, program) {
  return {
    program,
    purchased: hasActivePurchase(user, program),
    redirectPath: programRedirects[program] || "/workouts",
    paymentPath: `/payment/${program}`,
    user,
  };
}

async function savePurchasedPlan({
  userId,
  selectedPlan,
  orderId,
  paymentId,
  signature,
  amount,
  currency,
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

router.post("/select-plan", protect, async (req, res) => {
  try {
    const body = parseBody(req.body);
    const { normalizedProgram, selectedPlan } = getSelectedPlan(
      body.program || body.plan || body.planKey
    );

    if (!selectedPlan) {
      return res.status(400).json({
        message: "Invalid plan selection",
        receivedProgram: body.program || body.plan || body.planKey,
        normalizedProgram,
        allowedPlans: Object.keys(planPrices),
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        selectedPlan: selectedPlan.finalProgram,
        selectedProgram: selectedPlan.finalProgram,
      },
      { new: true }
    ).select("-password");

    res.json(buildAccessPayload(user, selectedPlan.finalProgram));
  } catch (error) {
    console.error("SELECT PLAN ERROR:", error);
    res.status(500).json({ message: error.message || "Failed to select plan" });
  }
});

router.get("/access/:program", protect, async (req, res) => {
  try {
    const { normalizedProgram, selectedPlan } = getSelectedPlan(req.params.program);

    if (!selectedPlan) {
      return res.status(400).json({
        message: "Invalid plan",
        normalizedProgram,
      });
    }

    const user = await User.findById(req.user.id).select("-password");
    res.json(buildAccessPayload(user, selectedPlan.finalProgram));
  } catch (error) {
    console.error("CHECK PLAN ACCESS ERROR:", error);
    res.status(500).json({ message: error.message || "Failed to check access" });
  }
});

router.get("/currency", protect, async (req, res) => {
  try {
    const country = await detectCountryCode(req, req.query.country);
    const currency = getCurrencyForCountry(country);
    const rates = await getExchangeRates();
    const dbPrices = await getDbPriceMapPaise();

    const prices = {};
    const seenPrograms = new Set();

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

    res.json({
      country,
      currency,
      symbol: SUPPORTED_CURRENCIES[currency]?.symbol || currency,
      prices,
    });
  } catch (error) {
    console.error("CURRENCY DETECTION ERROR:", error);

    const prices = {};
    const seenPrograms = new Set();

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

    res.json({
      country: "IN",
      currency: "INR",
      symbol: SUPPORTED_CURRENCIES.INR.symbol,
      prices,
      fallback: true,
    });
  }
});

router.post("/create-order", protect, async (req, res) => {
  try {
    const body = parseBody(req.body);
    const rawProgram = body.program || body.plan || body.planKey;
    const { normalizedProgram, selectedPlan } = getSelectedPlan(rawProgram);

    if (!selectedPlan) {
      return res.status(400).json({
        message: "Invalid payment plan",
        receivedProgram: rawProgram,
        normalizedProgram,
        allowedPlans: Object.keys(planPrices),
      });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        message: "Razorpay keys missing in server environment",
      });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const country = await detectCountryCode(req, body.country);
    const currency = getCurrencyForCountry(country);
    const rates = await getExchangeRates();
    const dbPrices = await getDbPriceMapPaise();
    const baseAmountPaise = dbPrices[selectedPlan.finalProgram] ?? selectedPlan.amount;
    const converted = convertFromInrPaise(baseAmountPaise, currency, rates);

    const orderNotes = {
      userId: req.user.id,
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

      // Fall back to the base currency if the detected currency isn't
      // supported by the Razorpay account.
      console.warn(
        `Order creation in ${currency} failed, falling back to INR:`,
        orderError.message
      );

      order = await razorpay.orders.create({
        amount: baseAmountPaise,
        currency: "INR",
        receipt: `buddy_${selectedPlan.finalProgram}_${Date.now()}`,
        notes: { ...orderNotes, fallback: "true" },
      });
    }

    res.json({
      orderId: order.id,
      amount: order.amount,
      displayAmount: formatCurrency(order.amount / 100, order.currency),
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      planTitle: selectedPlan.title,
      program: selectedPlan.finalProgram,
      redirectPath: programRedirects[selectedPlan.finalProgram],
      country,
    });
  } catch (error) {
    console.error("CREATE RAZORPAY ORDER ERROR:", error);
    res.status(500).json({
      message: error.message || "Failed to create payment order",
    });
  }
});

router.post("/verify", protect, async (req, res) => {
  try {
    const body = parseBody(req.body);

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        message: "Payment verification data missing",
      });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        message: "Razorpay keys missing in server environment",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        message: "Payment verification failed",
      });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Pull the authoritative order from Razorpay. Everything that determines
    // what the user gets — the plan, amount and currency — comes from the order
    // notes we set at creation time, never from client-supplied values.
    const order = await razorpay.orders.fetch(razorpay_order_id);

    // The order must belong to the authenticated user, otherwise a leaked
    // order/payment/signature triple could be replayed on another account.
    if (String(order.notes?.userId || "") !== String(req.user.id)) {
      return res.status(403).json({
        message: "This payment does not belong to your account",
      });
    }

    // Reject orders that were never paid against. A valid signature already
    // proves a real payment was made for this order, but this rejects the
    // clearly-unpaid "created" state too. (We avoid requiring strictly "paid"
    // so accounts using manual capture, where a valid payment sits in
    // "attempted" until captured, aren't blocked.)
    if (order.status === "created") {
      return res.status(400).json({
        message: "Payment has not been completed",
      });
    }

    // Derive the purchased plan from the order itself, not from the request
    // body, so a user can't pay for a cheap plan and claim an expensive one.
    const { selectedPlan } = getSelectedPlan(order.notes?.program);

    if (!selectedPlan) {
      return res.status(400).json({
        message: "Invalid payment plan",
      });
    }

    const user = await savePurchasedPlan({
      userId: req.user.id,
      selectedPlan,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      amount: order.amount,
      currency: order.currency,
    });

    res.json({
      success: true,
      message: "Payment verified successfully",
      program: selectedPlan.finalProgram,
      redirectPath: programRedirects[selectedPlan.finalProgram],
      user,
    });
  } catch (error) {
    console.error("VERIFY PAYMENT ERROR:", error);
    res.status(500).json({
      message: error.message || "Payment verification failed",
    });
  }
});

// --- Auto-renewing subscriptions (home-workout / normal-workouts) ----------

// Creates a Razorpay subscription and returns the data the checkout needs.
router.post("/subscribe/:program", protect, async (req, res) => {
  try {
    const { normalizedProgram, selectedPlan } = getSelectedPlan(req.params.program);

    if (!selectedPlan) {
      return res.status(400).json({ message: "Invalid plan", normalizedProgram });
    }

    const program = selectedPlan.finalProgram;
    if (!SUBSCRIPTION_PROGRAMS.has(program)) {
      return res.status(400).json({ message: "This plan is not available as a subscription" });
    }

    const razorpay = razorpayClient();
    if (!razorpay) {
      return res.status(500).json({ message: "Razorpay keys missing in server environment" });
    }

    const planId = await getOrCreateRazorpayPlan(razorpay, program, selectedPlan);

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      // 12 monthly cycles (~1 year) before Razorpay marks it completed; renews
      // automatically each month until then or until cancelled.
      total_count: 12,
      notes: { userId: req.user.id, program },
    });

    const user = await User.findById(req.user.id);
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

    res.json({
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      planTitle: selectedPlan.title,
      program,
      shortUrl: subscription.short_url,
      redirectPath: programRedirects[program],
    });
  } catch (error) {
    console.error("CREATE SUBSCRIPTION ERROR:", error);
    res.status(500).json({ message: error.message || "Failed to start subscription" });
  }
});

// Verifies the subscription checkout handshake and grants access immediately so
// the UX is instant. Revenue + renewals are recorded by the webhook.
router.post("/subscription/verify", protect, async (req, res) => {
  try {
    const body = parseBody(req.body);
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = body;

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return res.status(400).json({ message: "Subscription verification data missing" });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: "Razorpay keys missing in server environment" });
    }

    // For subscriptions the signature is HMAC(payment_id + "|" + subscription_id).
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Subscription verification failed" });
    }

    const razorpay = razorpayClient();
    const subscription = await razorpay.subscriptions.fetch(razorpay_subscription_id);

    if (String(subscription.notes?.userId || "") !== String(req.user.id)) {
      return res.status(403).json({ message: "This subscription does not belong to your account" });
    }

    const { selectedPlan } = getSelectedPlan(subscription.notes?.program);
    if (!selectedPlan) {
      return res.status(400).json({ message: "Invalid subscription plan" });
    }

    const program = selectedPlan.finalProgram;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
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
      currentStart: subscription.current_start ? new Date(subscription.current_start * 1000) : undefined,
      currentEnd: subscription.current_end ? new Date(subscription.current_end * 1000) : undefined,
    });

    await user.save();

    const safeUser = await User.findById(req.user.id).select("-password");
    res.json({
      success: true,
      message: "Subscription active",
      program,
      redirectPath: programRedirects[program],
      user: safeUser,
    });
  } catch (error) {
    console.error("VERIFY SUBSCRIPTION ERROR:", error);
    res.status(500).json({ message: error.message || "Subscription verification failed" });
  }
});

// Cancels a subscription at the end of the current billing cycle. Access remains
// until the already-paid period expires.
router.post("/subscription/cancel", protect, async (req, res) => {
  try {
    const body = parseBody(req.body);
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const targetProgram = getSelectedPlan(body.program).selectedPlan?.finalProgram;
    const record = (user.subscriptions || []).find((s) => {
      if (body.subscriptionId) return s.razorpaySubscriptionId === body.subscriptionId;
      return s.plan === targetProgram;
    });

    if (!record?.razorpaySubscriptionId) {
      return res.status(404).json({ message: "No active subscription found" });
    }

    const razorpay = razorpayClient();
    if (!razorpay) {
      return res.status(500).json({ message: "Razorpay keys missing in server environment" });
    }

    // cancel_at_cycle_end keeps access until the paid period ends.
    await razorpay.subscriptions.cancel(record.razorpaySubscriptionId, true);

    upsertSubscription(user, {
      razorpaySubscriptionId: record.razorpaySubscriptionId,
      status: "cancelled",
      cancelledAt: new Date(),
    });
    await user.save();

    const safeUser = await User.findById(req.user.id).select("-password");
    res.json({ success: true, message: "Subscription will end at the current billing cycle", user: safeUser });
  } catch (error) {
    console.error("CANCEL SUBSCRIPTION ERROR:", error);
    res.status(500).json({ message: error.message || "Failed to cancel subscription" });
  }
});

module.exports = router;
module.exports.SUBSCRIPTION_PROGRAMS = SUBSCRIPTION_PROGRAMS;
