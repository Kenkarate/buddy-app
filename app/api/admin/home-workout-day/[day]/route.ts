import { NextRequest } from "next/server";
import { HomeWorkoutDay } from "@/models/HomeWorkoutDay";
import { ok, AppError, withErrorHandler } from "@/lib/apiResponse";
import { requireNumber } from "@/lib/adminValidation";
import { readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=900&q=80";

function cleanExercise(exercise: any = {}) {
  return {
    exerciseId:
      exercise.exerciseId || exercise.workoutId || String(exercise._id || ""),
    name: exercise.name || exercise.workoutName || "Exercise",
    imageUrl:
      exercise.imageUrl ||
      exercise.image ||
      exercise.imageUrls?.[0] ||
      FALLBACK_IMAGE,
    equipment: exercise.equipment || "bodyweight",
    primaryMuscles: exercise.primaryMuscles || [exercise.bodyPart].filter(Boolean),
    instructions: exercise.instructions || [],
    sets: Number(exercise.sets || 3),
    reps: String(exercise.reps || "12"),
    rest: Number(exercise.rest || exercise.restSeconds || 60),
    notes: exercise.notes || "",
  };
}

function cleanDayPayload(body: any = {}, day: number, userId: string) {
  const bodyPart = body.bodyPart || "Full Body";
  return {
    day,
    bodyPart,
    title: body.title || `Day ${day} · ${bodyPart}`,
    exercises: Array.isArray(body.exercises)
      ? body.exercises.map(cleanExercise)
      : [],
    createdBy: userId,
  };
}

// GET one numbered day.
export const GET = withErrorHandler(
  async (req: NextRequest, { params }: { params: Promise<{ day: string }> }) => {
    await requireAdmin(req);
    const { day: dayParam } = await params;
    const day = requireNumber(dayParam, "day", { min: 1, max: 30, integer: true });
    const plan = await HomeWorkoutDay.findOne({ day });
    return ok(plan);
  }
);

// CREATE / UPDATE one numbered day (upsert keyed by day number).
export const PUT = withErrorHandler(
  async (req: NextRequest, { params }: { params: Promise<{ day: string }> }) => {
    const admin = await requireAdmin(req);
    const { day: dayParam } = await params;
    const day = requireNumber(dayParam, "day", { min: 1, max: 30, integer: true });
    const body = await readJson<any>(req);
    const payload = cleanDayPayload(body, day, String(admin._id));

    if (payload.exercises.length === 0) {
      throw new AppError(
        "Add at least one exercise to this day.",
        422,
        "VALIDATION_ERROR"
      );
    }

    const plan = await HomeWorkoutDay.findOneAndUpdate({ day }, payload, {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    });
    return ok(plan);
  }
);

// DELETE one numbered day.
export const DELETE = withErrorHandler(
  async (req: NextRequest, { params }: { params: Promise<{ day: string }> }) => {
    await requireAdmin(req);
    const { day: dayParam } = await params;
    const day = requireNumber(dayParam, "day", { min: 1, max: 30, integer: true });
    await HomeWorkoutDay.findOneAndDelete({ day });
    return ok({ success: true });
  }
);
