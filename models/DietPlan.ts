import mongoose from "mongoose";
const dietPlanSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    planName: String,

    category: {
      type: String,
      enum: ["cutting", "bulking", "maintenance"],
    },

    goal: {
      type: String,
      enum: ["cutting", "bulking", "maintenance"],
      required: true,
    },

    targetGoal: {
      type: String,
      enum: ["fat-loss", "weight-gain", "maintenance"],
      default: "fat-loss",
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
    duration: Number,
    suitableFor: {
      type: String,
      enum: ["all", "male", "female"],
      default: "all",
    },
    targetWeightRange: String,
    description: String,
    notes: String,

    macros: {
      carbsPercent: {
        type: Number,
        default: 45,
      },
      proteinPercent: {
        type: Number,
        default: 30,
      },
      fatsPercent: {
        type: Number,
        default: 25,
      },
    },

    meals: [
      {
        mealName: String,
        time: String,
        totalCalories: Number,
        foods: [
          {
            name: String,
            quantity: Number,
            unit: {
              type: String,
              default: "g",
            },
            measure: String,
            calories: Number,
            protein: Number,
            carbs: Number,
            fats: Number,
            fat: Number,
            fiber: Number,
            imageUrl: String,
            notes: String,
          },
        ],
      },
    ],

    assignedTo: {
      type: {
        type: String,
        enum: ["all", "specific", "bmi", "goal"],
        default: "all",
      },
      userIds: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      bmiCategory: String,
      goal: String,
    },

    assignedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const DietPlan = mongoose.models.DietPlan || mongoose.model("DietPlan", dietPlanSchema);

export default DietPlan;
