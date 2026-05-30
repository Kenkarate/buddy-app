const express = require("express");
const User = require("../models/User");
const WorkoutPlan = require("../models/WorkoutPlan");
const DietPlan = require("../models/DietPlan");
const UserWorkoutAssignment = require("../models/UserWorkoutAssignment");
const UserDietAssignment = require("../models/UserDietAssignment");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/clients", protect, adminOnly, async (req, res) => {
  const clients = await User.find({ role: "user" }).select("-password");
  res.json(clients);
});

router.get("/workout-plans", protect, adminOnly, async (req, res) => {
  const plans = await WorkoutPlan.find({ isActive: true });
  res.json(plans);
});

router.get("/diet-plans", protect, adminOnly, async (req, res) => {
  const plans = await DietPlan.find({ isActive: true });
  res.json(plans);
});

router.post("/assign-workout", protect, adminOnly, async (req, res) => {
  const { userId, workoutPlanId } = req.body;

  await UserWorkoutAssignment.updateMany(
    { userId },
    { isActive: false }
  );

  const assignment = await UserWorkoutAssignment.create({
    userId,
    workoutPlanId,
    assignedBy: req.user.id,
    isActive: true,
  });

  res.status(201).json(assignment);
});

router.post("/assign-diet", protect, adminOnly, async (req, res) => {
  const { userId, dietPlanId } = req.body;

  await UserDietAssignment.updateMany(
    { userId },
    { isActive: false }
  );

  const assignment = await UserDietAssignment.create({
    userId,
    dietPlanId,
    assignedBy: req.user.id,
    warningAccepted: false,
    isActive: true,
  });

  res.status(201).json(assignment);
});

module.exports = router;