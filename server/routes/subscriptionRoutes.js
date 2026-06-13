const express = require("express");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/start-trial", protect, async (req, res) => {
  const { selectedProgram } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      selectedProgram,
      subscriptionStatus: "trial",
      trialStartedAt: new Date(),
    },
    { new: true }
  ).select("-password");

  res.json(user);
});

router.post("/mock-payment-success", protect, async (req, res) => {
  res.status(410).json({
    message:
      "Mock payment is disabled. Use /api/payments/create-order and /api/payments/verify.",
  });
});

module.exports = router;
