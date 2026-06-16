const express = require("express");
const HomeWorkoutDay = require("../models/HomeWorkoutDay");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const { ok, AppError } = require("../utils/apiResponse");
const { requireNumber } = require("../utils/adminValidation");

const router = express.Router();

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=900&q=80";

function cleanExercise(exercise = {}) {
  return {
    exerciseId: exercise.exerciseId || exercise.workoutId || String(exercise._id || ""),
    name: exercise.name || exercise.workoutName || "Exercise",
    imageUrl: exercise.imageUrl || exercise.image || exercise.imageUrls?.[0] || FALLBACK_IMAGE,
    equipment: exercise.equipment || "bodyweight",
    primaryMuscles: exercise.primaryMuscles || [exercise.bodyPart].filter(Boolean),
    instructions: exercise.instructions || [],
    sets: Number(exercise.sets || 3),
    reps: String(exercise.reps || "12"),
    rest: Number(exercise.rest || exercise.restSeconds || 60),
    notes: exercise.notes || "",
  };
}

function cleanDayPayload(body = {}, day, userId) {
  const bodyPart = body.bodyPart || "Full Body";
  return {
    day,
    bodyPart,
    title: body.title || `Day ${day} · ${bodyPart}`,
    exercises: Array.isArray(body.exercises) ? body.exercises.map(cleanExercise) : [],
    createdBy: userId,
  };
}

// GET all 30 numbered days that have been built.
router.get("/home-workout-days", protect, adminOnly, async (req, res) => {
  const days = await HomeWorkoutDay.find().sort({ day: 1 });
  ok(res, { days });
});

// GET one numbered day.
router.get("/home-workout-day/:day", protect, adminOnly, async (req, res) => {
  const day = requireNumber(req.params.day, "day", { min: 1, max: 30, integer: true });
  const plan = await HomeWorkoutDay.findOne({ day });
  ok(res, plan);
});

// CREATE / UPDATE one numbered day (upsert keyed by day number).
router.put("/home-workout-day/:day", protect, adminOnly, async (req, res) => {
  const day = requireNumber(req.params.day, "day", { min: 1, max: 30, integer: true });
  const payload = cleanDayPayload(req.body, day, req.user.id);

  if (payload.exercises.length === 0) {
    throw new AppError("Add at least one exercise to this day.", 422, "VALIDATION_ERROR");
  }

  const plan = await HomeWorkoutDay.findOneAndUpdate({ day }, payload, {
    new: true,
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  });
  ok(res, plan);
});

// DELETE one numbered day.
router.delete("/home-workout-day/:day", protect, adminOnly, async (req, res) => {
  const day = requireNumber(req.params.day, "day", { min: 1, max: 30, integer: true });
  await HomeWorkoutDay.findOneAndDelete({ day });
  ok(res, { success: true });
});

module.exports = router;
