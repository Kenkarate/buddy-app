import mongoose from "mongoose";
const userDietAssignmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    dietPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DietPlan",
      required: true,
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    warningAccepted: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const UserDietAssignment = mongoose.models.UserDietAssignment || mongoose.model("UserDietAssignment", userDietAssignmentSchema);

export default UserDietAssignment;
