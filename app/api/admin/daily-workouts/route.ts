import { NextRequest } from "next/server";
import { DailyWorkoutPlan } from "@/models/DailyWorkoutPlan";
import { ok, withErrorHandler } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/auth";
import { toDateKey } from "@/lib/adminWorkout";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  const month = req.nextUrl.searchParams.get("month") || toDateKey().slice(0, 7);
  const plans = await DailyWorkoutPlan.find({
    date: { $regex: `^${month}` },
  }).sort({ date: 1 });
  return ok({ plans });
});
