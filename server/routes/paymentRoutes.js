const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

const planPrices = {
  normal: {
    title: "Normal Workout",
    amount: 8000, // ₹80
  },
  "normal-workout": {
    title: "Normal Workout",
    amount: 8000,
  },
  "normal-workouts": {
    title: "Normal Workout",
    amount: 8000,
  },
  home: {
    title: "Home Workout",
    amount: 15000, // ₹150
  },
  "home-workout": {
    title: "Home Workout",
    amount: 15000,
  },
  "home-workouts": {
    title: "Home Workout",
    amount: 15000,
  },
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

router.post("/create-order", protect, async (req, res) => {
  try {
    const body = parseBody(req.body);

    console.log("CREATE ORDER BODY:", body);

    const rawProgram = body.program || body.plan || body.planKey;

    const normalizedProgram = String(rawProgram || "")
      .trim()
      .toLowerCase();

    console.log("NORMALIZED PROGRAM:", normalizedProgram);

    const selectedPlan = planPrices[normalizedProgram];

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

    const order = await razorpay.orders.create({
      amount: selectedPlan.amount,
      currency: "INR",
      receipt: `buddy_${normalizedProgram}_${Date.now()}`,
      notes: {
        userId: req.user.id,
        program: normalizedProgram,
      },
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      displayAmount: `₹${order.amount / 100}`,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      planTitle: selectedPlan.title,
      program: normalizedProgram,
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

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        message: "Payment verification failed",
      });
    }

    res.json({
      success: true,
      message: "Payment verified successfully",
      program,
    });
  } catch (error) {
    console.error("VERIFY PAYMENT ERROR:", error);
    res.status(500).json({
      message: error.message || "Payment verification failed",
    });
  }
});

module.exports = router;