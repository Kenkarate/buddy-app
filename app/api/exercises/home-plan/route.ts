import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Exercise } from "@/models/Exercise";
import { normalizeExercise } from "@/lib/exercises";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const rows = await Exercise.find({
      isActive: { $ne: false },
      level: { $in: [/^beginner$/i, /^intermediate$/i] },
    })
      .sort({ bodyPart: 1, name: 1 })
      .limit(150);

    const exercises = rows.map(normalizeExercise);
    const days = Array.from({ length: 30 }, (_, index) => ({
      day: index + 1,
      exercises: exercises.slice(index * 5, index * 5 + 5),
    }));

    return NextResponse.json({ days });
  } catch (error) {
    console.error("HOME PLAN ERROR:", error);
    return NextResponse.json(
      { message: "Failed to load home workout plan" },
      { status: 500 }
    );
  }
}
