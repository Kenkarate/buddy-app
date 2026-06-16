const mongoose = require("mongoose");

const pricingPlanSchema = new mongoose.Schema(
  {
    planKey: {
      type: String,
      required: true,
      unique: true,
    },

    title: {
      type: String,
      required: true,
    },

    baseCurrency: {
      type: String,
      default: "SAR",
    },

    baseAmount: {
      type: Number,
      required: true,
    },

    monthly: {
      type: Boolean,
      default: true,
    },

    // Cached Razorpay Plan ID for the monthly subscription of this plan. Created
    // on demand the first time someone subscribes (see paymentRoutes).
    razorpayPlanId: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PricingPlan", pricingPlanSchema);