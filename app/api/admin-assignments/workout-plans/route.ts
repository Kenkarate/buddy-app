import { NextRequest } from "next/server";
import { WorkoutPlan } from "@/models/WorkoutPlan";
import { ok, withErrorHandler } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  const plans = await WorkoutPlan.find({ isActive: true });
  return ok(plans);
});
