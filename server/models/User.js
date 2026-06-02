const mongoose = require("mongoose");

const assignedWorkoutSchema = new mongoose.Schema({
  bodyPart: String,
  title: String,
  description: String,
  sets: String,
  reps: String,
  videoUrl: String,
});

const assignedDietSchema = new mongoose.Schema({
  meal: String,
  food: String,
  calories: Number,
  notes: String,
});

const weightRecordSchema = new mongoose.Schema({
  weight: Number,
  date: {
    type: Date,
    default: Date.now,
  },
});

const bmiRecordSchema = new mongoose.Schema({
  height: Number,
  weight: Number,
  bmi: Number,
  category: String,
  date: {
    type: Date,
    default: Date.now,
  },
});

const userSchema = new mongoose.Schema(
  {
    name: String,

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    selectedProgram: {
      type: String,
      enum: ["personal-training", "normal-workouts", "home-workout", ""],
      default: "",
    },

    subscriptionStatus: {
      type: String,
      enum: ["none", "trial", "paid", "expired"],
      default: "none",
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },

    trialStartedAt: Date,

    dietWarningAccepted: {
      type: Boolean,
      default: false,
    },

    age: Number,
    height: Number,
    weight: Number,
    goal: String,

    assignedWorkouts: [assignedWorkoutSchema],
    assignedDiet: [assignedDietSchema],
    weightRecords: [weightRecordSchema],
    bmiRecords: [bmiRecordSchema],

    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);