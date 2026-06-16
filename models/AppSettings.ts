import mongoose from "mongoose";
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

export const AppSettings = mongoose.models.AppSettings || mongoose.model("AppSettings", appSettingsSchema);

export default AppSettings;
