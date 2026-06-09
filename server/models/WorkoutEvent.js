const mongoose = require("mongoose");

const WorkoutEventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    workoutId: { type: String, index: true },
    exerciseId: { type: String, index: true },
    workoutName: { type: String, required: true },
    eventType: {
      type: String,
      enum: ["view", "complete", "checked"],
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ["normal", "home", "daily", "weekly"],
      default: "normal",
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "WorkoutEvent",
  WorkoutEventSchema,
  "workout_events"
);
