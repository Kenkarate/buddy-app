import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { WorkoutEvent } from "@/models/WorkoutEvent";
import { readJson } from "@/lib/http";
import { getAuthIdFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const userId = getAuthIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  try {
    const body = await readJson<{
      workoutId?: string;
      exerciseId?: string;
      workoutName?: string;
      eventType?: string;
      source?: string;
    }>(req);

    await connectDB();
    const event = await WorkoutEvent.create({
      userId,
      workoutId: body.workoutId || body.exerciseId,
      exerciseId: body.exerciseId || body.workoutId,
      workoutName: body.workoutName || "Workout",
      eventType: body.eventType,
      source: body.source || "normal",
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("WORKOUT EVENT ERROR:", error);
    return NextResponse.json(
      { message: "Failed to save workout event" },
      { status: 500 }
    );
  }
}
