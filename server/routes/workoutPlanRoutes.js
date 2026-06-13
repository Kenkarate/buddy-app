const express = require("express");
const DailyWorkoutPlan = require("../models/DailyWorkoutPlan");
const protect = require("../middleware/authMiddleware");
const { getCurrentWeeklyWorkout } = require("./weeklyWorkoutRoutes");

const router = express.Router();

function toDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

router.get("/daily", protect, async (req, res) => {
  try {
    const date = req.query.date || toDateKey();
    const plan = await DailyWorkoutPlan.findOne({ date });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: "Failed to load daily workout" });
  }
});

router.get("/weekly", protect, async (req, res) => {
  try {
    const plan = await getCurrentWeeklyWorkout();
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: "Failed to load weekly workout" });
  }
});

module.exports = router;
