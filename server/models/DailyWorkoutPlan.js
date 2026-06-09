const mongoose = require("mongoose");

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

const DailyWorkoutPlanSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true, index: true },
    bodyPart: { type: String, required: true },
    title: { type: String, default: "Daily Workout" },
    exercises: { type: [AssignedExerciseSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "DailyWorkoutPlan",
  DailyWorkoutPlanSchema,
  "daily_workout_plans"
);
