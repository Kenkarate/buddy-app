const express = require("express");
const PricingPlan = require("../models/PricingPlan");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const { ok, AppError } = require("../utils/apiResponse");
const { requireString, requireNumber } = require("../utils/adminValidation");

const router = express.Router();

const PLAN_KEYS = ["personal-training", "normal-workouts", "home-workout"];

// List all pricing plans (admin-editable source of truth for prices).
router.get("/", protect, adminOnly, async (req, res) => {
  const plans = await PricingPlan.find().sort({ baseAmount: 1 });
  ok(res, plans);
});

// Upsert a single plan's pricing by planKey.
router.put("/:planKey", protect, adminOnly, async (req, res) => {
  const planKey = req.params.planKey;

  if (!PLAN_KEYS.includes(planKey)) {
    throw new AppError(`Unknown plan key: ${planKey}`, 422, "VALIDATION_ERROR", {
      allowed: PLAN_KEYS,
    });
  }

  const title = requireString(req.body.title, "title");
  const baseCurrency = requireString(req.body.baseCurrency, "baseCurrency").toUpperCase();
  const baseAmount = requireNumber(req.body.baseAmount, "baseAmount", { min: 0 });
  const isActive = req.body.isActive !== false;

  const plan = await PricingPlan.findOneAndUpdate(
    { planKey },
    { planKey, title, baseCurrency, baseAmount, isActive },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  ok(res, plan);
});

module.exports = router;
