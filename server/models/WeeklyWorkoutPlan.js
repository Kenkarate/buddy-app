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

const WeeklyDaySchema = new mongoose.Schema(
  {
    dayName: { type: String, required: true },
    date: { type: String, required: true },
    bodyPart: { type: String, default: "" },
    title: { type: String, default: "" },
    exercises: { type: [AssignedExerciseSchema], default: [] },
  },
  { _id: true }
);

const WeeklyWorkoutPlanSchema = new mongoose.Schema(
  {
    weekStartDate: { type: String, required: true, unique: true, index: true },
    days: { type: [WeeklyDaySchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "WeeklyWorkoutPlan",
  WeeklyWorkoutPlanSchema,
  "weekly_workout_plans"
);
