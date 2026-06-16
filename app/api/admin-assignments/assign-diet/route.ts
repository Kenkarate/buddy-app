import { NextRequest, NextResponse } from "next/server";
import { UserDietAssignment } from "@/models/UserDietAssignment";
import { withErrorHandler } from "@/lib/apiResponse";
import { requireObjectId } from "@/lib/adminValidation";
import { readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const admin = await requireAdmin(req);
  const body = await readJson<Record<string, unknown>>(req);
  const userId = requireObjectId(body.userId, "userId");
  const dietPlanId = requireObjectId(body.dietPlanId, "dietPlanId");

  await UserDietAssignment.updateMany({ userId }, { isActive: false });

  const assignment = await UserDietAssignment.create({
    userId,
    dietPlanId,
    assignedBy: admin._id,
    warningAccepted: false,
    isActive: true,
  });

  return NextResponse.json({ data: assignment }, { status: 201 });
});
