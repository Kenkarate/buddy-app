const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    planKey: String,

    amount: Number,

    currency: {
      type: String,
      default: "SAR",
    },

    status: {
      type: String,
     enum: ["none", "paid", "expired"],
      default: "trial",
    },

    trialStartedAt: Date,
    trialEndsAt: Date,

    paidAt: Date,

    paymentProvider: String,
    providerPaymentId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);