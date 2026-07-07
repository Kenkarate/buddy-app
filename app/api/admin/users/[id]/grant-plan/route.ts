import { NextRequest } from "next/server";
import { User } from "@/models/User";
import { ok, AppError, withErrorHandler } from "@/lib/apiResponse";
import { requireEnum, requireNumber } from "@/lib/adminValidation";
import { readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { PLAN_KEYS, grantPlan, recordPayment } from "@/lib/planManagement";

const SAFE_USER_FIELDS = "-password -resetPasswordToken -resetPasswordExpires";

export const POST = withErrorHandler(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    await requireAdmin(req);
    const { id } = await params;
    const body = await readJson<Record<string, unknown>>(req);

    const plan = requireEnum(body.plan, "plan", PLAN_KEYS);
    const durationMonths = requireNumber(
      body.durationMonths ?? 1,
      "durationMonths",
      { min: 1, max: 60, integer: true }
    );
    const amount =
      body.amount === undefined
        ? 0
        : requireNumber(body.amount, "amount", { min: 0 });
    const currency = body.currency ? String(body.currency).toUpperCase() : "INR";

    const user = await User.findById(id);
    if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

    grantPlan(user, { plan, durationMonths, amount, currency });
    await user.save();

    await recordPayment({
      userId: user._id,
      plan,
      amount,
      currency,
      source: amount > 0 ? "admin" : "admin-comp",
    });

    const fresh = await User.findById(user._id).select(SAFE_USER_FIELDS);
    return ok({ user: fresh });
  }
);
