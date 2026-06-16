import { WorkoutEvent } from "@/models/WorkoutEvent";
import { AppError } from "@/lib/apiResponse";
import { toDateKey } from "@/lib/weeklyWorkout";

export { toDateKey };

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=900&q=80";

export function addDays(dateKey: string, amount: number): string {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

export function isSunday(dateKey?: string): boolean {
  if (!dateKey) return false;
  return new Date(`${dateKey}T00:00:00`).getDay() === 0;
}

export function cleanExercise(exercise: any = {}) {
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

export function cleanDailyPayload(body: any = {}, userId: string) {
  const exercises = Array.isArray(body.exercises)
    ? body.exercises.map(cleanExercise)
    : [];
  return {
    date: body.date,
    bodyPart: body.bodyPart || "Full Body",
    title: body.title || `${body.bodyPart || "Full Body"} Workout`,
    exercises,
    createdBy: userId,
  };
}

export function cleanWeeklyPayload(body: any = {}, userId: string) {
  const weekSundayDate = body.weekSundayDate || body.weekStartDate;

  if (!isSunday(weekSundayDate)) {
    throw new AppError(
      "Weekly workout can only be assigned on a Sunday date.",
      400,
      "BAD_REQUEST"
    );
  }

  const bodyPart = body.bodyPart || "Full Body";

  return {
    weekSundayDate,
    weekStartDate: addDays(weekSundayDate, 1),
    weekEndDate: addDays(weekSundayDate, 7),
    bodyPart,
    title: body.title || `${bodyPart} Weekly Workout`,
    exercises: Array.isArray(body.exercises)
      ? body.exercises.map(cleanExercise)
      : [],
    isActive: body.isActive !== false,
    createdBy: userId,
  };
}

export async function logAdminEvent(userId: string, workoutName: string) {
  try {
    await WorkoutEvent.create({
      userId,
      workoutId: "admin-assignment",
      exerciseId: "admin-assignment",
      workoutName,
      eventType: "checked",
      source: "daily",
    });
  } catch (error) {
    console.error("ADMIN EVENT LOG ERROR:", error);
  }
}
