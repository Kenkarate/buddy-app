const mongoose = require("mongoose");

const appSettingsSchema = new mongoose.Schema(
  {
    dailyWorkoutDurationHours: {
      type: Number,
      default: 24,
    },

    dailyWorkoutStartedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AppSettings", appSettingsSchema);