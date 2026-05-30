const express = require("express");
const AppSettings = require("../models/AppSettings");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

async function getOrCreateSettings() {
  let settings = await AppSettings.findOne();

  if (!settings) {
    settings = await AppSettings.create({
      dailyWorkoutDurationHours: 24,
      dailyWorkoutStartedAt: new Date(),
    });
  }

  return settings;
}

router.get("/", protect, async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Failed to load settings" });
  }
});

router.put("/daily-workout-timer", protect, adminOnly, async (req, res) => {
  try {
    const { dailyWorkoutDurationHours } = req.body;

    if (!dailyWorkoutDurationHours || dailyWorkoutDurationHours < 1) {
      return res.status(400).json({
        message: "Timer must be at least 1 hour",
      });
    }

    let settings = await getOrCreateSettings();

    settings.dailyWorkoutDurationHours = Number(dailyWorkoutDurationHours);
    settings.dailyWorkoutStartedAt = new Date();

    await settings.save();

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Failed to update timer" });
  }
});

module.exports = router;