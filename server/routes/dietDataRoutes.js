const express = require("express");
const DietPlan = require("../models/DietPlan");
const FoodItem = require("../models/FoodItem");
const UserDietAssignment = require("../models/UserDietAssignment");
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/plans", protect, async (req, res) => {
  const plans = await DietPlan.find({ isActive: true });
  res.json(plans);
});

function round(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 10) / 10;
}

function getLatestWeight(user) {
  if (user?.weight) return Number(user.weight);

  const records = Array.isArray(user?.weightRecords) ? user.weightRecords : [];
  if (!records.length) return null;

  const latest = records
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  return latest?.weight ? Number(latest.weight) : null;
}

function scalePlan(plan, userWeight) {
  const object = typeof plan.toObject === "function" ? plan.toObject() : plan;
  const baseWeight = Number(object.baseWeight || 70);
  const factor = userWeight ? userWeight / baseWeight : 1;

  return {
    ...object,
    userWeight,
    adjustmentFactor: round(factor),
    isPersonalized: Boolean(userWeight),
    personalizedMessage: userWeight
      ? `Adjusted for ${userWeight}kg.`
      : "Add your weight to get a personalized diet.",
    adjustedTargetCalories: round((object.targetCalories || object.maxCalories || 0) * factor),
    meals: (object.meals || []).map((meal) => ({
      ...meal,
      foods: (meal.foods || []).map((food) => ({
        ...food,
        adjustedQuantity: round((food.quantity || 0) * factor),
        adjustedCalories: round((food.calories || 0) * factor),
        adjustedProtein: round((food.protein || 0) * factor),
        adjustedCarbs: round((food.carbs || 0) * factor),
        adjustedFats: round((food.fats || food.fat || 0) * factor),
      })),
    })),
  };
}

router.get("/base-plans", protect, async (req, res) => {
  try {
    const plans = await DietPlan.find({
      goal: { $in: ["cutting", "bulking"] },
      isActive: true,
    }).sort({ goal: 1 });

    res.json({ plans });
  } catch (error) {
    console.error("LOAD BASE DIET PLANS ERROR:", error);
    res.status(500).json({ message: "Failed to load diet plans" });
  }
});

router.get("/personalized-plans", protect, async (req, res) => {
  try {
    const [user, plans] = await Promise.all([
      User.findById(req.user.id).select("weight weightRecords"),
      DietPlan.find({
        goal: { $in: ["cutting", "bulking"] },
        isActive: true,
      }).sort({ goal: 1 }),
    ]);

    const userWeight = getLatestWeight(user);

    res.json({
      userWeight,
      plans: plans.map((plan) => scalePlan(plan, userWeight)),
    });
  } catch (error) {
    console.error("LOAD PERSONALIZED DIET PLANS ERROR:", error);
    res.status(500).json({ message: "Failed to load personalized diet plans" });
  }
});

router.put("/base-plans/:goal", protect, adminOnly, async (req, res) => {
  try {
    const goal = req.params.goal;

    if (!["cutting", "bulking"].includes(goal)) {
      return res.status(400).json({ message: "Diet type must be cutting or bulking" });
    }

    await DietPlan.updateMany({ goal }, { isActive: false });

    const plan = await DietPlan.findOneAndUpdate(
      { goal, title: req.body.title || `${goal} Diet` },
      {
        title: req.body.title || (goal === "cutting" ? "Cutting Diet" : "Bulking Diet"),
        goal,
        baseWeight: Number(req.body.baseWeight || 70),
        targetCalories: Number(req.body.targetCalories || 0),
        minCalories: Number(req.body.targetCalories || 0),
        maxCalories: Number(req.body.targetCalories || 0),
        meals: Array.isArray(req.body.meals) ? req.body.meals : [],
        notes: req.body.notes || "",
        isActive: true,
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json(plan);
  } catch (error) {
    console.error("SAVE BASE DIET PLAN ERROR:", error);
    res.status(500).json({ message: error.message || "Failed to save diet plan" });
  }
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
