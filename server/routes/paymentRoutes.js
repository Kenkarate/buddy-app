const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const protect = require("../middleware/authMiddleware");
const User = require("../models/User");
const { detectCountryCode } = require("../utils/geoLocation");
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
  const purchaseDate = new Date();
  const planExpiryDate = new Date(purchaseDate);
  planExpiryDate.setMonth(planExpiryDate.getMonth() + 1);

  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  user.selectedProgram = selectedPlan.finalProgram;
  user.selectedPlan = selectedPlan.finalProgram;
  user.subscriptionStatus = "paid";
  user.paymentStatus = "paid";
  user.subscriptionStartedAt = purchaseDate;
  user.subscriptionExpiresAt = planExpiryDate;
  user.lastPayment = {
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    razorpaySignature: signature,
    program: selectedPlan.finalProgram,
    paidAt: purchaseDate,
  };

  user.purchasedPlans = (user.purchasedPlans || []).filter(
    (purchase) => purchase.plan !== selectedPlan.finalProgram
  );

  user.purchasedPlans.push({
    plan: selectedPlan.finalProgram,
    paymentStatus: "paid",
    paymentId,
    orderId,
    purchaseDate,
    planExpiryDate,
    amount,
    currency,
  });

  await user.save();

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

    const prices = {};
    const seenPrograms = new Set();

    for (const plan of Object.values(planPrices)) {
      if (seenPrograms.has(plan.finalProgram)) continue;
      seenPrograms.add(plan.finalProgram);

      const converted = convertFromInrPaise(plan.amount, currency, rates);

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
    const converted = convertFromInrPaise(selectedPlan.amount, currency, rates);

    const orderNotes = {
      userId: req.user.id,
      program: selectedPlan.finalProgram,
      country,
      baseAmount: String(selectedPlan.amount),
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
        amount: selectedPlan.amount,
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
      program,
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

    const { selectedPlan } = getSelectedPlan(program);

    if (!selectedPlan) {
      return res.status(400).json({
        message: "Invalid payment plan",
        receivedProgram: program,
      });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Pull the authoritative amount/currency from Razorpay rather than
    // trusting any value supplied by the client.
    const order = await razorpay.orders.fetch(razorpay_order_id);

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

module.exports = router;
