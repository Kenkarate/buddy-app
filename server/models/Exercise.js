const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
    },

    force: String,
    level: {
      type: String,
      index: true,
    },
    mechanic: String,
    equipment: {
      type: String,
      index: true,
    },
    primaryMuscles: {
      type: [String],
      default: [],
      index: true,
    },
    secondaryMuscles: {
      type: [String],
      default: [],
    },
    instructions: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      index: true,
    },
    images: {
      type: [String],
      default: [],
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    bodyPart: {
      type: String,
      index: true,
    },

    targetMuscle: {
      type: String,
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
