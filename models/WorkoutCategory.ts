import mongoose from "mongoose";
const workoutCategorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
    },

    type: {
      type: String,
      enum: ["normal", "home", "personal"],
      default: "normal",
    },

    imageUrl: String,

    musclesTrained: [String],

    isFirstFreeWorkout: {
      type: Boolean,
      default: false,
    },

    order: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const WorkoutCategory = mongoose.models.WorkoutCategory || mongoose.model("WorkoutCategory", workoutCategorySchema);

export default WorkoutCategory;
