import mongoose from "mongoose";
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
    },

    googleId: {
      type: String,
    },

    avatarUrl: {
      type: String,
    },

    authProvider: {
      type: String,
      enum: ["email", "google"],
      default: "email",
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

    selectedPlan: {
      type: String,
      enum: ["personal-training", "normal-workouts", "home-workout", ""],
      default: "",
    },

    subscriptionStatus: {
      type: String,
      enum: ["none", "trial", "paid", "expired"],
      default: "none",
    },

    paymentStatus: {
      type: String,
      enum: ["none", "paid", "expired", "failed"],
      default: "none",
    },

    purchasedPlans: [
      {
        plan: {
          type: String,
          enum: ["personal-training", "normal-workouts", "home-workout"],
          required: true,
        },
        paymentStatus: {
          type: String,
          enum: ["paid", "expired", "failed", "refunded"],
          default: "paid",
        },
        paymentId: String,
        orderId: String,
        purchaseDate: Date,
        planExpiryDate: Date,
        amount: Number,
        currency: String,
      },
    ],

    // Auto-renewing Razorpay subscriptions (home-workout / normal-workouts).
    // Access itself is still driven by purchasedPlans[] (refreshed on each
    // subscription.charged webhook); this array tracks the subscription lifecycle
    // so the user can see/cancel it.
    subscriptions: [
      {
        plan: {
          type: String,
          enum: ["personal-training", "normal-workouts", "home-workout"],
          required: true,
        },
        razorpaySubscriptionId: { type: String, index: true },
        razorpayPlanId: String,
        status: {
          type: String,
          enum: [
            "created",
            "authenticated",
            "active",
            "pending",
            "halted",
            "cancelled",
            "completed",
            "expired",
          ],
          default: "created",
        },
        shortUrl: String,
        currentStart: Date,
        currentEnd: Date,
        cancelledAt: Date,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    subscriptionStartedAt: {
      type: Date,
    },

    subscriptionExpiresAt: {
      type: Date,
    },

    lastPayment: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
      program: String,
      paidAt: Date,
    },

    resetPasswordToken: {
      type: String,
    },

    resetPasswordExpires: {
      type: Date,
    },

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
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
