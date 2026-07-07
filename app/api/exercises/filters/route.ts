import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Exercise } from "@/models/Exercise";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const [equipment, category, level, primaryMuscles, bodyParts] =
      await Promise.all([
        Exercise.distinct("equipment"),
        Exercise.distinct("category"),
        Exercise.distinct("level"),
        Exercise.distinct("primaryMuscles"),
        Exercise.distinct("bodyPart"),
      ]);

    const clean = (values: unknown[]) =>
      values
        .flat()
        .filter((value): value is string => typeof value === "string" && value.trim() !== "")
        .map((value) => value.trim())
        .sort((a, b) => a.localeCompare(b));

    return NextResponse.json({
      equipment: clean(equipment),
      category: clean(category),
      level: clean(level),
      primaryMuscles: clean(primaryMuscles),
      bodyParts: clean(bodyParts),
    });
  } catch (error) {
    console.error("EXERCISE FILTERS ERROR:", error);
    return NextResponse.json(
      { message: "Failed to load exercise filters" },
      { status: 500 }
    );
  }
}
