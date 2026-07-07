import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { UserDietAssignment } from "@/models/UserDietAssignment";
// Registers DietPlan so .populate("dietPlanId") resolves it.
import "@/models/DietPlan";
import { getAuthIdFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = getAuthIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  await connectDB();
  const assignment = await UserDietAssignment.findOne({
    userId,
    isActive: true,
  }).populate("dietPlanId");

  return NextResponse.json(assignment);
}
