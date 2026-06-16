import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { WorkoutPlan } from "@/models/WorkoutPlan";
// Registers the Exercise model so .populate("exercises.exerciseId") resolves it.
import "@/models/Exercise";
import { getAuthIdFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const userId = getAuthIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  const { slug } = await params;
  await connectDB();
  const plan = await WorkoutPlan.findOne({ slug, isActive: true }).populate(
    "exercises.exerciseId"
  );

  if (!plan) {
    return NextResponse.json({ message: "Workout plan not found" }, { status: 404 });
  }
  return NextResponse.json(plan);
}
