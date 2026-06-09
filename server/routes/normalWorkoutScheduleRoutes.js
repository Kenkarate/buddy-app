const express = require("express");
const NormalWorkoutSchedule = require("../models/NormalWorkoutSchedule");

const router = express.Router();

function parseBody(body) {
  if (!body) return {};

  if (body?.type === "Buffer" && Array.isArray(body.data)) {
    return JSON.parse(Buffer.from(body.data).toString("utf8"));
  }

  if (Buffer.isBuffer(body)) {
    return JSON.parse(body.toString("utf8"));
  }

  if (typeof body === "string") {
    return JSON.parse(body);
  }

  return body;
}

function summarizeBodyParts(workouts = [], fallback = "Mixed") {
  const uniqueBodyParts = [
    ...new Set(
      workouts
        .map((workout) => workout.bodyPart)
        .filter(Boolean)
        .map((part) => String(part).trim())
    ),
  ];

  if (uniqueBodyParts.length === 0) return fallback || "Mixed";
  if (uniqueBodyParts.length === 1) return uniqueBodyParts[0];
  return "Mixed";
}

// GET all schedules for a month
// Example: /api/normal-workout-schedules?month=2026-06
router.get("/", async (req, res) => {
  try {
    const month = req.query.month;

    const filter = month
      ? {
          dateKey: {
            $regex: `^${month}`,
          },
        }
      : {};

    const schedules = await NormalWorkoutSchedule.find(filter).sort({
      dateKey: 1,
    });

    res.json(schedules);
  } catch (error) {
    console.error("GET NORMAL WORKOUT SCHEDULES ERROR:", error);
    res.status(500).json({
      message: "Failed to load schedules",
    });
  }
});

// GET one date schedule
// Example: /api/normal-workout-schedules/2026-06-07
router.get("/:dateKey", async (req, res) => {
  try {
    const schedule = await NormalWorkoutSchedule.findOne({
      dateKey: req.params.dateKey,
    });

    if (!schedule) {
      return res.json(null);
    }

    res.json(schedule);
  } catch (error) {
    console.error("GET NORMAL WORKOUT SCHEDULE ERROR:", error);
    res.status(500).json({
      message: "Failed to load schedule",
    });
  }
});

// CREATE / UPDATE one date schedule
router.put("/:dateKey", async (req, res) => {
  try {
    const body = parseBody(req.body);

    const dateKey = req.params.dateKey;
    const workouts = Array.isArray(body.workouts) ? body.workouts : [];

    if (!dateKey) {
      return res.status(400).json({
        message: "Date is required",
      });
    }

    const bodyPart = summarizeBodyParts(workouts, body.bodyPart);

    const cleanedWorkouts = workouts.map((workout) => ({
      workoutId: workout.workoutId,
      workoutName: workout.workoutName,
      bodyPart: workout.bodyPart || bodyPart,
      image: workout.image || "",
      gif: workout.gif || "",
      sets: Number(workout.sets || 0),
      reps: String(workout.reps || ""),
      restSeconds: Number(workout.restSeconds || 45),
      notes: workout.notes || "",
    }));

    const schedule = await NormalWorkoutSchedule.findOneAndUpdate(
      { dateKey },
      {
        dateKey,
        bodyPart,
        workouts: cleanedWorkouts,
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    res.json(schedule);
  } catch (error) {
    console.error("SAVE NORMAL WORKOUT SCHEDULE ERROR:", error);
    res.status(500).json({
      message: error.message || "Failed to save schedule",
    });
  }
});

// DELETE full date schedule
router.delete("/:dateKey", async (req, res) => {
  try {
    await NormalWorkoutSchedule.findOneAndDelete({
      dateKey: req.params.dateKey,
    });

    res.json({
      success: true,
      message: "Schedule deleted",
    });
  } catch (error) {
    console.error("DELETE NORMAL WORKOUT SCHEDULE ERROR:", error);
    res.status(500).json({
      message: "Failed to delete schedule",
    });
  }
});

module.exports = router;
