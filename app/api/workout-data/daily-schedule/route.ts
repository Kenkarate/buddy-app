import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { DailyWorkoutSchedule } from "@/models/DailyWorkoutSchedule";
import { readJson } from "@/lib/http";
import { getAuthIdFromRequest, getUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = getAuthIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  try {
    await connectDB();
    let schedule = await DailyWorkoutSchedule.findOne({ isActive: true }).sort({
      createdAt: -1,
    });

    if (!schedule) {
      const startsAt = new Date();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const warningAt = new Date(expiresAt.getTime() - 6 * 60 * 60 * 1000);

      schedule = await DailyWorkoutSchedule.create({
        currentWorkoutSlug: "mixed-workout",
        nextWorkoutSlug: "chest",
        startsAt,
        expiresAt,
        warningAt,
        isActive: true,
      });
    }

    return NextResponse.json(schedule);
  } catch {
    return NextResponse.json(
      { message: "Failed to load daily schedule" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ message: "Admin access only" }, { status: 403 });
  }

  try {
    const { currentWorkoutSlug, nextWorkoutSlug, hours } = await readJson<{
      currentWorkoutSlug?: string;
      nextWorkoutSlug?: string;
      hours?: number;
    }>(req);

    if (!currentWorkoutSlug || !nextWorkoutSlug) {
      return NextResponse.json(
        { message: "Current workout and next workout are required" },
        { status: 400 }
      );
    }

    const durationHours = Number(hours || 24);

    await connectDB();
    await DailyWorkoutSchedule.updateMany({}, { isActive: false });

    const startsAt = new Date();
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    const warningAt = new Date(expiresAt.getTime() - 6 * 60 * 60 * 1000);

    const schedule = await DailyWorkoutSchedule.create({
      currentWorkoutSlug,
      nextWorkoutSlug,
      startsAt,
      expiresAt,
      warningAt,
      isActive: true,
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Failed to update daily schedule" },
      { status: 500 }
    );
  }
}
