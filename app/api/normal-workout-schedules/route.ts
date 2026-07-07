import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { NormalWorkoutSchedule } from "@/models/NormalWorkoutSchedule";

export const dynamic = "force-dynamic";

// GET all schedules for a month — e.g. /api/normal-workout-schedules?month=2026-06
// (intentionally unauthenticated, matching the original Express route)
export async function GET(req: NextRequest) {
  try {
    const month = req.nextUrl.searchParams.get("month");
    const filter = month ? { dateKey: { $regex: `^${month}` } } : {};

    await connectDB();
    const schedules = await NormalWorkoutSchedule.find(filter).sort({
      dateKey: 1,
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("GET NORMAL WORKOUT SCHEDULES ERROR:", error);
    return NextResponse.json(
      { message: "Failed to load schedules" },
      { status: 500 }
    );
  }
}
