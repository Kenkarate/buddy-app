const express = require("express");
const HomeWorkoutDay = require("../models/HomeWorkoutDay");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

const PLAN = "home-workout";

// Resolves the user's home-workout start (= their payment date) and expiry so
// the client can compute the 24h-per-day unlock progression. Returns nulls when
// the user has no active home-workout purchase.
function resolveWindow(user) {
  const now = new Date();

  const purchase = (user.purchasedPlans || [])
    .filter((p) => p.plan === PLAN && p.paymentStatus === "paid")
    .sort((a, b) => new Date(b.purchaseDate || 0) - new Date(a.purchaseDate || 0))[0];

  if (purchase) {
    const expiry = purchase.planExpiryDate ? new Date(purchase.planExpiryDate) : null;
    return {
      startDate: purchase.purchaseDate || null,
      expiryDate: purchase.planExpiryDate || null,
      hasAccess: !expiry || expiry > now,
    };
  }

  // Legacy fallback: selectedProgram + subscription dates.
  if (user.selectedProgram === PLAN && user.subscriptionStatus === "paid") {
    const expiry = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null;
    return {
      startDate: user.subscriptionStartedAt || null,
      expiryDate: user.subscriptionExpiresAt || null,
      hasAccess: !expiry || expiry > now,
    };
  }

  return { startDate: null, expiryDate: null, hasAccess: false };
}

// Returns the full 30-day program plus this user's unlock window. The client
// unlocks Day N once 24h * (N-1) have elapsed since startDate, and locks
// everything once the 30-day window expires.
router.get("/plan", protect, async (req, res) => {
  try {
    const [days, user] = await Promise.all([
      HomeWorkoutDay.find().sort({ day: 1 }),
      User.findById(req.user.id).select("purchasedPlans selectedProgram subscriptionStatus subscriptionStartedAt subscriptionExpiresAt"),
    ]);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const window = resolveWindow(user);
    res.json({ ...window, days });
  } catch (error) {
    console.error("HOME WORKOUT PLAN ERROR:", error);
    res.status(500).json({ message: "Failed to load home workout plan" });
  }
});

module.exports = router;
