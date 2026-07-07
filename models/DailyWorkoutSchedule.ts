import mongoose from "mongoose";
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

export const DailyWorkoutSchedule = mongoose.models.DailyWorkoutSchedule || mongoose.model(
  "DailyWorkoutSchedule",
  dailyWorkoutScheduleSchema
);

export default DailyWorkoutSchedule;
