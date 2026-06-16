import { WeeklyWorkoutPlan } from "@/models/WeeklyWorkoutPlan";

export function toDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateKey: string, amount: number): string {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

function assignmentSundayForDate(value: Date | string = new Date()): string {
  const date =
    value instanceof Date ? new Date(value) : new Date(`${value}T00:00:00`);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 7 : day));
  return toDateKey(date);
}

function startOfWeek(dateKey?: string): string {
  const date = dateKey ? new Date(`${dateKey}T00:00:00`) : new Date();
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toDateKey(date);
}

function normalizePlan(plan: any) {
  if (!plan) return null;

  if (plan.exercises?.length) {
    return plan;
  }

  const assignedLegacyDay = (plan.days || []).find(
    (day: any) => day.exercises?.length
  );

  if (!assignedLegacyDay) {
    return plan;
  }

  const object = plan.toObject ? plan.toObject() : plan;

  return {
    ...object,
    bodyPart: assignedLegacyDay.bodyPart,
    title:
      assignedLegacyDay.title || `${assignedLegacyDay.bodyPart} Weekly Workout`,
    exercises: assignedLegacyDay.exercises,
  };
}

export async function getCurrentWeeklyWorkout(date: Date = new Date()) {
  const today = toDateKey(date);
  const weekSundayDate = assignmentSundayForDate(date);

  const currentPlan = await WeeklyWorkoutPlan.findOne({
    isActive: { $ne: false },
    $or: [
      { weekSundayDate },
      {
        weekStartDate: { $lte: today },
        weekEndDate: { $gte: today },
      },
    ],
  }).sort({ weekSundayDate: -1, weekStartDate: -1 });

  if (currentPlan) {
    return normalizePlan(currentPlan);
  }

  const legacyWeekStartDate = startOfWeek(today);
  const legacyPlan = await WeeklyWorkoutPlan.findOne({
    isActive: { $ne: false },
    weekStartDate: legacyWeekStartDate,
  });

  return normalizePlan(legacyPlan);
}
