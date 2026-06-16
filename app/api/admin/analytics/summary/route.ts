import { NextRequest } from "next/server";
import { User } from "@/models/User";
import { Exercise } from "@/models/Exercise";
import { DailyWorkoutPlan } from "@/models/DailyWorkoutPlan";
import { WeeklyWorkoutPlan } from "@/models/WeeklyWorkoutPlan";
import { WorkoutEvent } from "@/models/WorkoutEvent";
import { Payment } from "@/models/Payment";
import { ok, withErrorHandler } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  const weekAhead = new Date(now);
  weekAhead.setDate(now.getDate() + 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // A purchase that currently grants access: paid and not yet expired.
  const activePurchaseMatch = {
    paymentStatus: "paid",
    $or: [{ planExpiryDate: { $exists: false } }, { planExpiryDate: { $gt: now } }],
  };

  const [
    totalUsers,
    paidUsers,
    freeUsers,
    newUsersThisWeek,
    totalWorkouts,
    dailyPlans,
    weeklyPlans,
    completedEvents,
    viewedEvents,
    payments,
    revenueByPlanRows,
    activeSubscribers,
    expiringSoon,
    topCategory,
  ] = await Promise.all([
    User.countDocuments({ role: "user" }),
    User.countDocuments({ role: "user", subscriptionStatus: "paid" }),
    User.countDocuments({ role: "user", subscriptionStatus: { $ne: "paid" } }),
    User.countDocuments({ role: "user", createdAt: { $gte: weekAgo } }),
    Exercise.countDocuments({ isActive: { $ne: false } }),
    DailyWorkoutPlan.countDocuments(),
    WeeklyWorkoutPlan.countDocuments(),
    WorkoutEvent.countDocuments({ eventType: { $in: ["complete", "checked"] } }),
    WorkoutEvent.countDocuments({ eventType: "view" }),
    Payment.aggregate([
      { $match: { status: "paid", createdAt: { $gte: monthStart } } },
      { $group: { _id: null, amount: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]).catch(() => []),
    Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: "$planKey", amount: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { amount: -1 } },
    ]).catch(() => []),
    User.countDocuments({
      role: "user",
      purchasedPlans: { $elemMatch: activePurchaseMatch },
    }),
    User.countDocuments({
      role: "user",
      purchasedPlans: {
        $elemMatch: {
          paymentStatus: "paid",
          planExpiryDate: { $gt: now, $lte: weekAhead },
        },
      },
    }),
    Exercise.aggregate([
      { $match: { isActive: { $ne: false }, bodyPart: { $nin: [null, ""] } } },
      { $group: { _id: "$bodyPart", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]),
  ]);

  const totalRevenue = revenueByPlanRows.reduce(
    (sum: number, row: any) => sum + (row.amount || 0),
    0
  );

  return ok({
    totalUsers,
    activeUsers: viewedEvents + completedEvents,
    paidUsers,
    freeUsers,
    totalWorkouts,
    totalAssignedDailyWorkouts: dailyPlans,
    totalAssignedWeeklyWorkouts: weeklyPlans,
    workoutsCheckedByUsers: completedEvents,
    workoutViews: viewedEvents,
    mostUsedWorkoutCategory: topCategory[0]?._id || "Not available",
    newUsersThisWeek,
    paymentsThisMonth: payments[0]?.amount || 0,
    paymentsThisMonthCount: payments[0]?.count || 0,
    activeSubscribers,
    expiringSoon,
    conversionRate: totalUsers > 0 ? Math.round((paidUsers / totalUsers) * 100) : 0,
    totalRevenue,
    revenueByPlan: revenueByPlanRows.map((row: any) => ({
      plan: row._id || "unknown",
      amount: row.amount || 0,
      count: row.count || 0,
    })),
  });
});
