const mongoose = require("mongoose");

const dailyWorkoutScheduleSchema = new mongoose.Schema(
  {
    currentWorkoutSlug: {
      type: String,
      required: true,
    },

    nextWorkoutSlug: {
      type: String,
      required: true,
    },

    startsAt: {
      type: Date,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    warningAt: Date,

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "DailyWorkoutSchedule",
  dailyWorkoutScheduleSchema
);