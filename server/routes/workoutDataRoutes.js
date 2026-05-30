const express = require("express");
const WorkoutCategory = require("../models/WorkoutCategory");
const WorkoutPlan = require("../models/WorkoutPlan");
const Exercise = require("../models/Exercise");
const UserWorkoutAssignment = require("../models/UserWorkoutAssignment");
const DailyWorkoutSchedule = require("../models/DailyWorkoutSchedule");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/categories", protect, async (req, res) => {
  const categories = await WorkoutCategory.find({ isActive: true }).sort({
    order: 1,
  });

  res.json(categories);
});

router.get("/plans", protect, async (req, res) => {
  const plans = await WorkoutPlan.find({ isActive: true }).populate(
    "exercises.exerciseId"
  );

  res.json(plans);
});

router.get("/plans/:slug", protect, async (req, res) => {
  const plan = await WorkoutPlan.findOne({
    slug: req.params.slug,
    isActive: true,
  }).populate("exercises.exerciseId");

  if (!plan) {
    return res.status(404).json({ message: "Workout plan not found" });
  }

  res.json(plan);
});

router.get("/my-assigned-workouts", protect, async (req, res) => {
  const assignments = await UserWorkoutAssignment.find({
    userId: req.user.id,
    isActive: true,
  }).populate({
    path: "workoutPlanId",
    populate: {
      path: "exercises.exerciseId",
      model: "Exercise",
    },
  });

  res.json(assignments);
});

router.post("/categories", protect, adminOnly, async (req, res) => {
  const category = await WorkoutCategory.create(req.body);
  res.status(201).json(category);
});

router.post("/exercises", protect, adminOnly, async (req, res) => {
  const exercise = await Exercise.create(req.body);
  res.status(201).json(exercise);
});

router.post("/plans", protect, adminOnly, async (req, res) => {
  const plan = await WorkoutPlan.create(req.body);
  res.status(201).json(plan);
});

router.get("/daily-schedule", protect, async (req, res) => {
  try {
    let schedule = await DailyWorkoutSchedule.findOne({ isActive: true }).sort({
      createdAt: -1,
    });

    if (!schedule) {
      const startsAt = new Date();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const warningAt = new Date(expiresAt.getTime() - 6 * 60 * 60 * 1000);

      schedule = await DailyWorkoutSchedule.create({
        currentWorkoutSlug: "mixed-workout",
        nextWorkoutSlug: "chest",
        startsAt,
        expiresAt,
        warningAt,
        isActive: true,
      });
    }

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: "Failed to load daily schedule" });
  }
});

router.post("/daily-schedule", protect, adminOnly, async (req, res) => {
  try {
    const { currentWorkoutSlug, nextWorkoutSlug, hours } = req.body;

    if (!currentWorkoutSlug || !nextWorkoutSlug) {
      return res.status(400).json({
        message: "Current workout and next workout are required",
      });
    }

    const durationHours = Number(hours || 24);

    await DailyWorkoutSchedule.updateMany({}, { isActive: false });

    const startsAt = new Date();
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    const warningAt = new Date(expiresAt.getTime() - 6 * 60 * 60 * 1000);

    const schedule = await DailyWorkoutSchedule.create({
      currentWorkoutSlug,
      nextWorkoutSlug,
      startsAt,
      expiresAt,
      warningAt,
      isActive: true,
    });

    res.status(201).json(schedule);
  } catch (error) {
    res.status(500).json({ message: "Failed to update daily schedule" });
  }
});

module.exports = router;