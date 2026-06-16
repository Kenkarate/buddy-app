import { NextRequest, NextResponse } from "next/server";
import { UserWorkoutAssignment } from "@/models/UserWorkoutAssignment";
import { withErrorHandler } from "@/lib/apiResponse";
import { requireObjectId } from "@/lib/adminValidation";
import { readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const admin = await requireAdmin(req);
  const body = await readJson<Record<string, unknown>>(req);
  const userId = requireObjectId(body.userId, "userId");
  const workoutPlanId = requireObjectId(body.workoutPlanId, "workoutPlanId");

  await UserWorkoutAssignment.updateMany({ userId }, { isActive: false });

  const assignment = await UserWorkoutAssignment.create({
    userId,
    workoutPlanId,
    assignedBy: admin._id,
    isActive: true,
  });

  return NextResponse.json({ data: assignment }, { status: 201 });
});
