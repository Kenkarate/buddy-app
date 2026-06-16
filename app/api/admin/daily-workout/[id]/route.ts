import { NextRequest } from "next/server";
import { DailyWorkoutPlan } from "@/models/DailyWorkoutPlan";
import { ok, withErrorHandler } from "@/lib/apiResponse";
import { readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { cleanDailyPayload } from "@/lib/adminWorkout";

export const PUT = withErrorHandler(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const admin = await requireAdmin(req);
    const { id } = await params;
    const body = await readJson<any>(req);
    const payload = cleanDailyPayload(body, String(admin._id));
    const plan = await DailyWorkoutPlan.findByIdAndUpdate(id, payload, {
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
    await DailyWorkoutPlan.findByIdAndDelete(id);
    return ok({ success: true });
  }
);
