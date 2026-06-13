const express = require("express");
const WeeklyWorkoutPlan = require("../models/WeeklyWorkoutPlan");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

function toDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateKey, amount) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

function assignmentSundayForDate(value = new Date()) {
  const date = value instanceof Date ? new Date(value) : new Date(`${value}T00:00:00`);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 7 : day));
  return toDateKey(date);
}

function startOfWeek(dateKey) {
  const date = dateKey ? new Date(`${dateKey}T00:00:00`) : new Date();
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toDateKey(date);
}

function normalizePlan(plan) {
  if (!plan) return null;

  if (plan.exercises?.length) {
    return plan;
  }

  const assignedLegacyDay = (plan.days || []).find((day) => day.exercises?.length);

  if (!assignedLegacyDay) {
    return plan;
  }

  const object = plan.toObject ? plan.toObject() : plan;

  return {
    ...object,
    bodyPart: assignedLegacyDay.bodyPart,
    title: assignedLegacyDay.title || `${assignedLegacyDay.bodyPart} Weekly Workout`,
    exercises: assignedLegacyDay.exercises,
  };
}

async function getCurrentWeeklyWorkout(date = new Date()) {
  const today = toDateKey(date);
  const weekSundayDate = assignmentSundayForDate(date);
  const weekStartDate = addDays(weekSundayDate, 1);
  const weekEndDate = addDays(weekSundayDate, 7);

  const currentPlan = await WeeklyWorkoutPlan.findOne({
    isActive: { $ne: false },
    $or: [
      { weekSundayDate },
      {
        weekStartDate: { $lte: today },
        weekEndDate: { $gte: today },
      },
    ],
  }).sort({ weekSundayDate: -1, weekStartDate: -1 });

  if (currentPlan) {
    return normalizePlan(currentPlan);
  }

  const legacyWeekStartDate = startOfWeek(today);
  const legacyPlan = await WeeklyWorkoutPlan.findOne({
    isActive: { $ne: false },
    weekStartDate: legacyWeekStartDate,
  });

  return normalizePlan(legacyPlan);
}

router.get("/current", protect, async (req, res) => {
  try {
    const plan = await getCurrentWeeklyWorkout();
    res.json(plan);
  } catch (error) {
    console.error("CURRENT WEEKLY WORKOUT ERROR:", error);
    res.status(500).json({ message: "Failed to load current weekly workout" });
  }
});

module.exports = {
  router,
  getCurrentWeeklyWorkout,
};
