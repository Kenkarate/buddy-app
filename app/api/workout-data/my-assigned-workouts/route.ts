import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { UserWorkoutAssignment } from "@/models/UserWorkoutAssignment";
// Side-effect imports register the referenced models so .populate() resolves
// them under Next's lazy model registration.
import "@/models/WorkoutPlan";
import "@/models/Exercise";
import { getAuthIdFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = getAuthIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  await connectDB();
  const assignments = await UserWorkoutAssignment.find({
    userId,
    isActive: true,
  }).populate({
    path: "workoutPlanId",
    populate: { path: "exercises.exerciseId", model: "Exercise" },
  });

  return NextResponse.json(assignments);
}
