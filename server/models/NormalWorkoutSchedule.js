const mongoose = require("mongoose");

const AssignedWorkoutSchema = new mongoose.Schema(
  {
    workoutId: {
      type: String,
      required: true,
    },

    workoutName: {
      type: String,
      required: true,
    },

    bodyPart: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      default: "",
    },

    gif: {
      type: String,
      default: "",
    },

    sets: {
      type: Number,
      required: true,
    },

    reps: {
      type: String,
      required: true,
    },

    restSeconds: {
      type: Number,
      default: 45,
    },

    notes: {
      type: String,
      default: "",
    },
  },
  { _id: true }
);

const NormalWorkoutScheduleSchema = new mongoose.Schema(
  {
    dateKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    bodyPart: {
      type: String,
      required: true,
    },

    workouts: {
      type: [AssignedWorkoutSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "NormalWorkoutSchedule",
  NormalWorkoutScheduleSchema,
  "normal_workout_schedules"
);