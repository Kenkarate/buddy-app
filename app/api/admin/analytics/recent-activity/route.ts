import { NextRequest } from "next/server";
import { User } from "@/models/User";
import { WorkoutEvent } from "@/models/WorkoutEvent";
import { DailyWorkoutPlan } from "@/models/DailyWorkoutPlan";
import { ok, withErrorHandler } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);

  const [users, events, dailyPlans] = await Promise.all([
    User.find({ role: "user" })
      .sort({ createdAt: -1 })
      .limit(8)
      .select("name email createdAt"),
    WorkoutEvent.find()
      .sort({ createdAt: -1 })
      .limit(12)
      .populate("userId", "name email"),
    DailyWorkoutPlan.find()
      .sort({ updatedAt: -1 })
      .limit(6)
      .select("title date bodyPart updatedAt"),
  ]);

  const activity = [
    ...users.map((user: any) => ({
      id: String(user._id),
      type: "user_registered",
      title: `${user.name || user.email} registered`,
      detail: user.email,
      createdAt: user.createdAt,
    })),
    ...events.map((event: any) => ({
      id: String(event._id),
      type: `workout_${event.eventType}`,
      title: `${event.userId?.name || event.userId?.email || "User"} ${event.eventType} ${event.workoutName}`,
      detail: event.source,
      createdAt: event.createdAt,
    })),
    ...dailyPlans.map((plan: any) => ({
      id: String(plan._id),
      type: "admin_assigned_workout",
      title: `Admin assigned ${plan.title}`,
      detail: plan.date,
      createdAt: plan.updatedAt,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 15);

  return ok({ activity });
});
