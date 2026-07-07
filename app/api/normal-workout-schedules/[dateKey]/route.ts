import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { NormalWorkoutSchedule } from "@/models/NormalWorkoutSchedule";
import { readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

function summarizeBodyParts(workouts: any[] = [], fallback = "Mixed"): string {
  const uniqueBodyParts = [
    ...new Set(
      workouts
        .map((workout) => workout.bodyPart)
        .filter(Boolean)
        .map((part) => String(part).trim())
    ),
  ];

  if (uniqueBodyParts.length === 0) return fallback || "Mixed";
  if (uniqueBodyParts.length === 1) return uniqueBodyParts[0];
  return "Mixed";
}

// GET one date schedule — e.g. /api/normal-workout-schedules/2026-06-07
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ dateKey: string }> }
) {
  try {
    const { dateKey } = await params;
    await connectDB();
    const schedule = await NormalWorkoutSchedule.findOne({ dateKey });
    return NextResponse.json(schedule ?? null);
  } catch (error) {
    console.error("GET NORMAL WORKOUT SCHEDULE ERROR:", error);
    return NextResponse.json(
      { message: "Failed to load schedule" },
      { status: 500 }
    );
  }
}

// CREATE / UPDATE one date schedule
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ dateKey: string }> }
) {
  try {
    const { dateKey } = await params;
    const body = await readJson<{ workouts?: any[]; bodyPart?: string }>(req);
    const workouts = Array.isArray(body.workouts) ? body.workouts : [];

    if (!dateKey) {
      return NextResponse.json({ message: "Date is required" }, { status: 400 });
    }

    const bodyPart = summarizeBodyParts(workouts, body.bodyPart);

    const cleanedWorkouts = workouts.map((workout) => ({
      workoutId: workout.workoutId,
      workoutName: workout.workoutName,
      bodyPart: workout.bodyPart || bodyPart,
      image: workout.image || "",
      gif: workout.gif || "",
      sets: Number(workout.sets || 0),
      reps: String(workout.reps || ""),
      restSeconds: Number(workout.restSeconds || 45),
      notes: workout.notes || "",
    }));

    await connectDB();
    const schedule = await NormalWorkoutSchedule.findOneAndUpdate(
      { dateKey },
      { dateKey, bodyPart, workouts: cleanedWorkouts },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json(schedule);
  } catch (error) {
    console.error("SAVE NORMAL WORKOUT SCHEDULE ERROR:", error);
    return NextResponse.json(
      { message: (error as Error).message || "Failed to save schedule" },
      { status: 500 }
    );
  }
}

// DELETE full date schedule
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ dateKey: string }> }
) {
  try {
    const { dateKey } = await params;
    await connectDB();
    await NormalWorkoutSchedule.findOneAndDelete({ dateKey });
    return NextResponse.json({ success: true, message: "Schedule deleted" });
  } catch (error) {
    console.error("DELETE NORMAL WORKOUT SCHEDULE ERROR:", error);
    return NextResponse.json(
      { message: "Failed to delete schedule" },
      { status: 500 }
    );
  }
}
