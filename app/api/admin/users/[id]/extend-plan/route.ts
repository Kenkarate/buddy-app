import { NextRequest } from "next/server";
import { User } from "@/models/User";
import { ok, AppError, withErrorHandler } from "@/lib/apiResponse";
import { requireEnum, requireNumber } from "@/lib/adminValidation";
import { readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { PLAN_KEYS, extendPlan } from "@/lib/planManagement";

const SAFE_USER_FIELDS = "-password -resetPasswordToken -resetPasswordExpires";

export const POST = withErrorHandler(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    await requireAdmin(req);
    const { id } = await params;
    const body = await readJson<Record<string, unknown>>(req);

    const plan = requireEnum(body.plan, "plan", PLAN_KEYS);
    const addMonths = requireNumber(body.addMonths ?? 1, "addMonths", {
      min: 1,
      max: 60,
      integer: true,
    });

    const user = await User.findById(id);
    if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

    const newExpiry = extendPlan(user, { plan, addMonths });
    if (!newExpiry) {
      throw new AppError(
        "User has no purchase for that plan to extend",
        400,
        "NO_PURCHASE"
      );
    }

    await user.save();

    const fresh = await User.findById(user._id).select(SAFE_USER_FIELDS);
    return ok({ user: fresh });
  }
);
