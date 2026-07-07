import mongoose from "mongoose";
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
      default: "INR",
    },

    status: {
      type: String,
      enum: ["none", "trial", "paid", "expired"],
      default: "none",
    },

    trialStartedAt: Date,
    trialEndsAt: Date,

    paidAt: Date,

    paymentProvider: String,
    providerPaymentId: String,
  },
  { timestamps: true }
);

export const Payment = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);

export default Payment;
