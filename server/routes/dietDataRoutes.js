const express = require("express");
const DietPlan = require("../models/DietPlan");
const FoodItem = require("../models/FoodItem");
const UserDietAssignment = require("../models/UserDietAssignment");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/plans", protect, async (req, res) => {
  const plans = await DietPlan.find({ isActive: true });
  res.json(plans);
});

router.get("/food-items", protect, async (req, res) => {
  const items = await FoodItem.find({ isActive: true });
  res.json(items);
});

router.get("/my-diet", protect, async (req, res) => {
  const assignment = await UserDietAssignment.findOne({
    userId: req.user.id,
    isActive: true,
  }).populate("dietPlanId");

  res.json(assignment);
});

router.post("/accept-warning", protect, async (req, res) => {
  const assignment = await UserDietAssignment.findOneAndUpdate(
    {
      userId: req.user.id,
      isActive: true,
    },
    {
      warningAccepted: true,
    },
    {
      returnDocument: "after",
    }
  ).populate("dietPlanId");

  res.json(assignment);
});

router.post("/plans", protect, adminOnly, async (req, res) => {
  const plan = await DietPlan.create(req.body);
  res.status(201).json(plan);
});

router.post("/food-items", protect, adminOnly, async (req, res) => {
  const item = await FoodItem.create(req.body);
  res.status(201).json(item);
});

module.exports = router;