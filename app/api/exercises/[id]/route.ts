import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Exercise } from "@/models/Exercise";
import { normalizeExercise } from "@/lib/exercises";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const query = id.match(/^[a-f\d]{24}$/i)
      ? { $or: [{ _id: id }, { exerciseId: id }] }
      : { exerciseId: id };
    const exercise = await Exercise.findOne(query);

    if (!exercise) {
      return NextResponse.json({ message: "Exercise not found" }, { status: 404 });
    }

    return NextResponse.json(normalizeExercise(exercise));
  } catch (error) {
    console.error("GET EXERCISE ERROR:", error);
    return NextResponse.json(
      { message: "Failed to load exercise" },
      { status: 500 }
    );
  }
}
