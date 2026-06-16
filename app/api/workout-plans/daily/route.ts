import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { DailyWorkoutPlan } from "@/models/DailyWorkoutPlan";
import { toDateKey } from "@/lib/weeklyWorkout";
import { getAuthIdFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = getAuthIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  try {
    const date = req.nextUrl.searchParams.get("date") || toDateKey();
    await connectDB();
    const plan = await DailyWorkoutPlan.findOne({ date });
    return NextResponse.json(plan);
  } catch {
    return NextResponse.json(
      { message: "Failed to load daily workout" },
      { status: 500 }
    );
  }
}
