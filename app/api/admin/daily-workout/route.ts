import { NextRequest } from "next/server";
import { DailyWorkoutPlan } from "@/models/DailyWorkoutPlan";
import { ok, withErrorHandler } from "@/lib/apiResponse";
import { readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { cleanDailyPayload, logAdminEvent, toDateKey } from "@/lib/adminWorkout";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  const date = req.nextUrl.searchParams.get("date") || toDateKey();
  const plan = await DailyWorkoutPlan.findOne({ date });
  return ok(plan);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const admin = await requireAdmin(req);
  const body = await readJson<any>(req);
  const payload = cleanDailyPayload(body, String(admin._id));
  const plan = await DailyWorkoutPlan.findOneAndUpdate(
    { date: payload.date },
    payload,
    { upsert: true, new: true, runValidators: true }
  );
  await logAdminEvent(String(admin._id), plan.title);
  return ok(plan);
});
