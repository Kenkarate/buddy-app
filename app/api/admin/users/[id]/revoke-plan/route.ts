import { NextRequest } from "next/server";
import { User } from "@/models/User";
import { ok, AppError, withErrorHandler } from "@/lib/apiResponse";
import { requireEnum } from "@/lib/adminValidation";
import { readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";
import { PLAN_KEYS, revokePlan } from "@/lib/planManagement";

const SAFE_USER_FIELDS = "-password -resetPasswordToken -resetPasswordExpires";

export const POST = withErrorHandler(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    await requireAdmin(req);
    const { id } = await params;
    const body = await readJson<Record<string, unknown>>(req);

    const plan = requireEnum(body.plan, "plan", PLAN_KEYS);

    const user = await User.findById(id);
    if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

    revokePlan(user, { plan });
    await user.save();

    const fresh = await User.findById(user._id).select(SAFE_USER_FIELDS);
    return ok({ user: fresh });
  }
);
