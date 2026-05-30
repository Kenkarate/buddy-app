const mongoose = require("mongoose");

const contactIssueSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    email: String,

    type: {
      type: String,
      enum: ["Query", "Complaint", "Trainer Partnership"],
      default: "Query",
    },

    subject: String,
    message: String,

    trainerBusinessName: String,
    experience: String,
    phone: String,

    status: {
      type: String,
      enum: ["open", "in-progress", "closed"],
      default: "open",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContactIssue", contactIssueSchema);