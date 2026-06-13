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

const WeeklyWorkoutPlanSchema = new mongoose.Schema(
  {
    weekSundayDate: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      index: true,
    },
    weekStartDate: { type: String, required: true, index: true },
    weekEndDate: { type: String, required: true, index: true },
    bodyPart: { type: String, default: "Full Body" },
    title: { type: String, default: "" },
    exercises: { type: [AssignedExerciseSchema], default: [] },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "WeeklyWorkoutPlan",
  WeeklyWorkoutPlanSchema,
  "weekly_workout_plans"
);
