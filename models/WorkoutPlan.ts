import mongoose from "mongoose";
const workoutPlanSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
    },

    title: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    image: String,

    description: String,

    muscles: [String],

    locked: {
      type: Boolean,
      default: false,
    },

    exercises: [
      {
        exerciseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Exercise",
        },

        sets: Number,
        reps: Number,
        count: Number,
        restSeconds: Number,
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const WorkoutPlan = mongoose.models.WorkoutPlan || mongoose.model("WorkoutPlan", workoutPlanSchema);

export default WorkoutPlan;
