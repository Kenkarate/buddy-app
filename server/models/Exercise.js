const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    targetMuscle: {
      type: String,
      required: true,
    },

    musclesTrained: [String],

    gifUrl: String,
    imageUrl: String,

    beginnerCaption: String,

    defaultSets: {
      type: Number,
      default: 3,
    },

    defaultReps: {
      type: Number,
      default: 12,
    },

    defaultCount: Number,

    restSeconds: {
      type: Number,
      default: 60,
    },

    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exercise", exerciseSchema);