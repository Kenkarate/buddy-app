import mongoose from "mongoose";
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

export const ContactIssue = mongoose.models.ContactIssue || mongoose.model("ContactIssue", contactIssueSchema);

export default ContactIssue;
