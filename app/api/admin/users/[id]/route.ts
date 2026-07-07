import { NextRequest } from "next/server";
import { User } from "@/models/User";
import { WorkoutEvent } from "@/models/WorkoutEvent";
import { Payment } from "@/models/Payment";
import { ContactIssue } from "@/models/ContactIssue";
import { ok, AppError, withErrorHandler } from "@/lib/apiResponse";
import { readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const SAFE_USER_FIELDS = "-password -resetPasswordToken -resetPasswordExpires";

export const GET = withErrorHandler(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    await requireAdmin(req);
    const { id } = await params;

    const [user, events, payments, tickets] = await Promise.all([
      User.findById(id).select(SAFE_USER_FIELDS),
      WorkoutEvent.find({ userId: id }).sort({ createdAt: -1 }).limit(40),
      Payment.find({ userId: id }).sort({ createdAt: -1 }).limit(40),
      ContactIssue.find({ userId: id }).sort({ createdAt: -1 }).limit(20),
    ]);

    if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

    return ok({ user, events, payments, tickets });
  }
);

export const PATCH = withErrorHandler(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    await requireAdmin(req);
    const { id } = await params;
    const body = await readJson<Record<string, unknown>>(req);

    const updates: Record<string, unknown> = {};

    if (body.subscriptionStatus !== undefined) {
      if (!["none", "trial", "paid", "expired"].includes(body.subscriptionStatus as string)) {
        throw new AppError("Invalid subscription status", 422, "VALIDATION_ERROR");
      }
      updates.subscriptionStatus = body.subscriptionStatus;
    }

    if (body.selectedPlan !== undefined) {
      if (
        !["personal-training", "normal-workouts", "home-workout", ""].includes(
          body.selectedPlan as string
        )
      ) {
        throw new AppError("Invalid plan", 422, "VALIDATION_ERROR");
      }
      updates.selectedPlan = body.selectedPlan;
      updates.selectedProgram = body.selectedPlan;
    }

    if (Object.keys(updates).length === 0) {
      throw new AppError("No valid fields to update", 422, "VALIDATION_ERROR");
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select(
      SAFE_USER_FIELDS
    );

    if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

    return ok({ user });
  }
);

export const DELETE = withErrorHandler(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const admin = await requireAdmin(req);
    const { id } = await params;

    if (String(admin._id) === String(id)) {
      throw new AppError("You cannot delete your own account", 400, "BAD_REQUEST");
    }

    const user = await User.findById(id);
    if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
    if (user.role === "admin") {
      throw new AppError("Cannot delete an admin account", 400, "BAD_REQUEST");
    }

    await User.findByIdAndDelete(id);
    await WorkoutEvent.deleteMany({ userId: id });

    return ok({ success: true });
  }
);
