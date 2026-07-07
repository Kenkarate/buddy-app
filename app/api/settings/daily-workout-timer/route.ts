import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getOrCreateSettings } from "@/lib/appSettings";
import { readJson } from "@/lib/http";
import { getUserFromRequest } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ message: "Admin access only" }, { status: 403 });
  }

  try {
    const { dailyWorkoutDurationHours } = await readJson<{
      dailyWorkoutDurationHours?: number;
    }>(req);

    if (!dailyWorkoutDurationHours || dailyWorkoutDurationHours < 1) {
      return NextResponse.json(
        { message: "Timer must be at least 1 hour" },
        { status: 400 }
      );
    }

    await connectDB();
    const settings = await getOrCreateSettings();
    settings.dailyWorkoutDurationHours = Number(dailyWorkoutDurationHours);
    settings.dailyWorkoutStartedAt = new Date();
    await settings.save();

    return NextResponse.json(settings);
  } catch {
    return NextResponse.json(
      { message: "Failed to update timer" },
      { status: 500 }
    );
  }
}
