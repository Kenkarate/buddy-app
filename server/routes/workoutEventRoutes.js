const express = require("express");
const WorkoutEvent = require("../models/WorkoutEvent");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, async (req, res) => {
  try {
    const event = await WorkoutEvent.create({
      userId: req.user.id,
      workoutId: req.body.workoutId || req.body.exerciseId,
      exerciseId: req.body.exerciseId || req.body.workoutId,
      workoutName: req.body.workoutName || "Workout",
      eventType: req.body.eventType,
      source: req.body.source || "normal",
    });

    res.status(201).json(event);
  } catch (error) {
    console.error("WORKOUT EVENT ERROR:", error);
    res.status(500).json({ message: "Failed to save workout event" });
  }
});

module.exports = router;
