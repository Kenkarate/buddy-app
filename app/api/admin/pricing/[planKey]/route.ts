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
    const monthly = body.monthly !== false;

    // When switching from subscription to one-time, the cached Razorpay plan ID
    // is no longer valid — a new one will be created on demand if switched back.
    const existing = await PricingPlan.findOne({ planKey });
    const wasSubscription = existing?.monthly !== false;
    const clearRazorpayPlanId = wasSubscription && !monthly;

    const update: Record<string, unknown> = {
      planKey, title, baseCurrency, baseAmount, isActive, monthly,
    };
    if (clearRazorpayPlanId) update.razorpayPlanId = "";

    const plan = await PricingPlan.findOneAndUpdate(
      { planKey },
      update,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return ok(plan);
  }
);
