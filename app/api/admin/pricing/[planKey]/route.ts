import { NextRequest } from "next/server";
import { PricingPlan } from "@/models/PricingPlan";
import { ok, AppError, withErrorHandler } from "@/lib/apiResponse";
import { requireString, requireNumber } from "@/lib/adminValidation";
import { readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";

const PLAN_KEYS = ["personal-training", "normal-workouts", "home-workout"];

// Upsert a single plan's pricing by planKey.
export const PUT = withErrorHandler(
  async (req: NextRequest, { params }: { params: Promise<{ planKey: string }> }) => {
    await requireAdmin(req);
    const { planKey } = await params;

    if (!PLAN_KEYS.includes(planKey)) {
      throw new AppError(`Unknown plan key: ${planKey}`, 422, "VALIDATION_ERROR", {
        allowed: PLAN_KEYS,
      });
    }

    const body = await readJson<Record<string, unknown>>(req);
    const title = requireString(body.title, "title");
    const baseCurrency = requireString(body.baseCurrency, "baseCurrency").toUpperCase();
    const baseAmount = requireNumber(body.baseAmount, "baseAmount", { min: 0 });
    const isActive = body.isActive !== false;

    const plan = await PricingPlan.findOneAndUpdate(
      { planKey },
      { planKey, title, baseCurrency, baseAmount, isActive },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return ok(plan);
  }
);
