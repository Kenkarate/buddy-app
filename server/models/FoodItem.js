const mongoose = require("mongoose");

const foodItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: ["carbs", "protein", "fat", "vegetable", "fruit", "other"],
      default: "other",
    },

    baseQuantity: {
      type: Number,
      default: 100,
    },

    unit: {
      type: String,
      default: "g",
    },

    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,

    mealTiming: String,

    tags: [String],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FoodItem", foodItemSchema);