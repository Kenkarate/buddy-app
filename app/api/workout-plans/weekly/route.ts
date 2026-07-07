import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getCurrentWeeklyWorkout } from "@/lib/weeklyWorkout";
import { getAuthIdFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = getAuthIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const plan = await getCurrentWeeklyWorkout();
    return NextResponse.json(plan);
  } catch {
    return NextResponse.json(
      { message: "Failed to load weekly workout" },
      { status: 500 }
    );
  }
}
