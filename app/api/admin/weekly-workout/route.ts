import { NextRequest } from "next/server";
import { WeeklyWorkoutPlan } from "@/models/WeeklyWorkoutPlan";
import { ok, AppError, withErrorHandler } from "@/lib/apiResponse";
import { readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { cleanWeeklyPayload, isSunday } from "@/lib/adminWorkout";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  const sp = req.nextUrl.searchParams;
  const weekSundayDate = sp.get("weekSundayDate") || sp.get("weekStartDate");

  if (!weekSundayDate || !isSunday(weekSundayDate)) {
    throw new AppError(
      "Select a Sunday date to load a weekly workout.",
      400,
      "BAD_REQUEST"
    );
  }

  const plan = await WeeklyWorkoutPlan.findOne({ weekSundayDate });
  return ok(plan);
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const admin = await requireAdmin(req);
  const body = await readJson<any>(req);
  const payload = cleanWeeklyPayload(body, String(admin._id));
  const plan = await WeeklyWorkoutPlan.findOneAndUpdate(
    {
      $or: [
        { weekSundayDate: payload.weekSundayDate },
        { weekStartDate: payload.weekStartDate },
      ],
    },
    payload,
    { upsert: true, new: true, runValidators: true }
  );
  return ok(plan);
});
