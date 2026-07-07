import { NextRequest } from "next/server";
import { DietPlan } from "@/models/DietPlan";
import { ok, withErrorHandler } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  const plans = await DietPlan.find({ isActive: true });
  return ok(plans);
});
