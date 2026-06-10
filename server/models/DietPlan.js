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

    baseWeight: {
      type: Number,
      default: 70,
    },

    targetCalories: {
      type: Number,
      default: 0,
    },

    minCalories: Number,
    maxCalories: Number,
    notes: String,

    meals: [
      {
        mealName: String,
        time: String,
        foods: [
          {
            name: String,
            quantity: Number,
            unit: {
              type: String,
              default: "g",
            },
            calories: Number,
            protein: Number,
            carbs: Number,
            fats: Number,
            fat: Number,
            notes: String,
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
