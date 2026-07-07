import { NextRequest } from "next/server";
import { WeeklyWorkoutPlan } from "@/models/WeeklyWorkoutPlan";
import { ok, withErrorHandler } from "@/lib/apiResponse";
import { readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { cleanWeeklyPayload } from "@/lib/adminWorkout";

export const PUT = withErrorHandler(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const admin = await requireAdmin(req);
    const { id } = await params;
    const body = await readJson<any>(req);
    const payload = cleanWeeklyPayload(body, String(admin._id));
    const plan = await WeeklyWorkoutPlan.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    return ok(plan);
  }
);

export const DELETE = withErrorHandler(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    await requireAdmin(req);
    const { id } = await params;
    await WeeklyWorkoutPlan.findByIdAndDelete(id);
    return ok({ success: true });
  }
);
