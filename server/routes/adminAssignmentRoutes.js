const express = require("express");
const User = require("../models/User");
const WorkoutPlan = require("../models/WorkoutPlan");
const DietPlan = require("../models/DietPlan");
const UserWorkoutAssignment = require("../models/UserWorkoutAssignment");
const UserDietAssignment = require("../models/UserDietAssignment");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const { ok } = require("../utils/apiResponse");
const { requireObjectId } = require("../utils/adminValidation");

const router = express.Router();

router.get("/clients", protect, adminOnly, async (req, res) => {
  const clients = await User.find({ role: "user" }).select("-password");
  ok(res, clients);
});

router.get("/workout-plans", protect, adminOnly, async (req, res) => {
  const plans = await WorkoutPlan.find({ isActive: true });
  ok(res, plans);
});

router.get("/diet-plans", protect, adminOnly, async (req, res) => {
  const plans = await DietPlan.find({ isActive: true });
  ok(res, plans);
});

router.post("/assign-workout", protect, adminOnly, async (req, res) => {
  const userId = requireObjectId(req.body.userId, "userId");
  const workoutPlanId = requireObjectId(req.body.workoutPlanId, "workoutPlanId");

  await UserWorkoutAssignment.updateMany({ userId }, { isActive: false });

  const assignment = await UserWorkoutAssignment.create({
    userId,
    workoutPlanId,
    assignedBy: req.user.id,
    isActive: true,
  });

  ok(res.status(201), assignment);
});

router.post("/assign-diet", protect, adminOnly, async (req, res) => {
  const userId = requireObjectId(req.body.userId, "userId");
  const dietPlanId = requireObjectId(req.body.dietPlanId, "dietPlanId");

  await UserDietAssignment.updateMany({ userId }, { isActive: false });

  const assignment = await UserDietAssignment.create({
    userId,
    dietPlanId,
    assignedBy: req.user.id,
    warningAccepted: false,
    isActive: true,
  });

  ok(res.status(201), assignment);
});

module.exports = router;
