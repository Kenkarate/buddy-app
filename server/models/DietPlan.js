const mongoose = require("mongoose");

const dietPlanSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    goal: {
      type: String,
      enum: ["cutting", "bulking", "maintenance"],
      required: true,
    },

    minCalories: Number,
    maxCalories: Number,

    meals: [
      {
        mealName: String,
        time: String,
        foods: [
          {
            name: String,
            quantity: String,
            calories: Number,
            protein: Number,
            carbs: Number,
            fat: Number,
          },
        ],
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DietPlan", dietPlanSchema);