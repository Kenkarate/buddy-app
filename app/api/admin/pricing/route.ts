import { NextRequest } from "next/server";
import { PricingPlan } from "@/models/PricingPlan";
import { ok, withErrorHandler } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// List all pricing plans (admin-editable source of truth for prices).
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  const plans = await PricingPlan.find().sort({ baseAmount: 1 });
  return ok(plans);
});
