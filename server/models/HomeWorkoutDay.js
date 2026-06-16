const mongoose = require("mongoose");

// One numbered day (1..30) of the home-workout program. Unlike the calendar-date
// based DailyWorkoutPlan, home-workout content is keyed by a relative day number
// so each user progresses through Day 1..Day 30 starting from their own payment
// date (the user page unlocks one new day every 24h).
const AssignedExerciseSchema = new mongoose.Schema(
  {
    exerciseId: { type: String, required: true },
    name: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    equipment: { type: String, default: "bodyweight" },
    primaryMuscles: { type: [String], default: [] },
    instructions: { type: [String], default: [] },
    sets: { type: Number, default: 3 },
    reps: { type: String, default: "12" },
    rest: { type: Number, default: 60 },
    notes: { type: String, default: "" },
  },
  { _id: true }
);

const HomeWorkoutDaySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true, unique: true, index: true, min: 1, max: 30 },
    bodyPart: { type: String, required: true },
    title: { type: String, default: "Home Workout" },
    exercises: { type: [AssignedExerciseSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "HomeWorkoutDay",
  HomeWorkoutDaySchema,
  "home_workout_days"
);
