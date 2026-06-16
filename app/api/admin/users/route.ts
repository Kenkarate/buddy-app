import { NextRequest } from "next/server";
import { User } from "@/models/User";
import { WorkoutEvent } from "@/models/WorkoutEvent";
import { ok, withErrorHandler } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  const sp = req.nextUrl.searchParams;

  const query = String(sp.get("q") || "").trim();
  const filter: Record<string, unknown> = { role: "user" };
  if (query) {
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const subscriptionStatus = sp.get("subscriptionStatus");
  if (subscriptionStatus) {
    filter.subscriptionStatus = subscriptionStatus;
  }

  if (sp.has("selectedPlan")) {
    filter.selectedPlan = sp.get("selectedPlan");
  }

  const page = Math.max(1, parseInt(sp.get("page") || "", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") || "", 10) || 20));

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-password -resetPasswordToken -resetPasswordExpires"),
    User.countDocuments(filter),
  ]);

  const userIds = users.map((user) => user._id);
  const events = await WorkoutEvent.aggregate([
    { $match: { userId: { $in: userIds } } },
    {
      $group: {
        _id: "$userId",
        viewed: { $sum: { $cond: [{ $eq: ["$eventType", "view"] }, 1, 0] } },
        completed: {
          $sum: { $cond: [{ $in: ["$eventType", ["complete", "checked"]] }, 1, 0] },
        },
        lastActive: { $max: "$createdAt" },
      },
    },
  ]);
  const eventMap = new Map(events.map((row: any) => [String(row._id), row]));

  return ok(
    users.map((user: any) => {
      const stats: any = eventMap.get(String(user._id)) || {};
      return {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus,
        selectedProgram: user.selectedProgram,
        selectedPlan: user.selectedPlan,
        purchasedPlans: user.purchasedPlans || [],
        joinedDate: user.createdAt,
        workoutsViewed: stats.viewed || 0,
        workoutsCompleted: stats.completed || 0,
        lastActiveDate: stats.lastActive || user.updatedAt,
        bmiRecords: user.bmiRecords || [],
      };
    }),
    {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    }
  );
});
