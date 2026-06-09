const express = require("express");
const DailyWorkoutPlan = require("../models/DailyWorkoutPlan");
const WeeklyWorkoutPlan = require("../models/WeeklyWorkoutPlan");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

function toDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(dateKey) {
  const date = dateKey ? new Date(`${dateKey}T00:00:00`) : new Date();
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toDateKey(date);
}

function addDays(dateKey, amount) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
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
    const weekStartDate = req.query.weekStartDate || startOfWeek();
    const exactPlan = await WeeklyWorkoutPlan.findOne({ weekStartDate });

    const hasAssignedDays = (plan) =>
      Boolean(plan?.days?.some((day) => day.exercises?.length));

    if (hasAssignedDays(exactPlan)) {
      return res.json(exactPlan);
    }

    const fallbackPlan = await WeeklyWorkoutPlan.findOne({
      weekStartDate: { $lt: weekStartDate },
      "days.exercises.0": { $exists: true },
    }).sort({ weekStartDate: -1 });

    if (!fallbackPlan) {
      return res.json(exactPlan);
    }

    const object = fallbackPlan.toObject();
    return res.json({
      ...object,
      weekStartDate,
      days: (object.days || []).map((day, index) => ({
        ...day,
        date: addDays(weekStartDate, index),
      })),
      isFallback: true,
      requestedWeekStartDate: weekStartDate,
      fallbackWeekStartDate: object.weekStartDate,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load weekly workout" });
  }
});

module.exports = router;
