import { NextRequest } from "next/server";
import { User } from "@/models/User";
import { ok, withErrorHandler } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Users whose active plan expires within the next N days (default 7).
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);

  const now = new Date();
  const days = Math.min(
    90,
    Math.max(1, parseInt(req.nextUrl.searchParams.get("days") || "", 10) || 7)
  );
  const horizon = new Date(now);
  horizon.setDate(now.getDate() + days);

  const users = await User.find({
    role: "user",
    purchasedPlans: {
      $elemMatch: { paymentStatus: "paid", planExpiryDate: { $gt: now, $lte: horizon } },
    },
  })
    .select("name email purchasedPlans")
    .limit(100);

  const expiring: any[] = [];
  for (const user of users) {
    for (const purchase of user.purchasedPlans || []) {
      const expiry = purchase.planExpiryDate
        ? new Date(purchase.planExpiryDate)
        : null;
      if (
        purchase.paymentStatus === "paid" &&
        expiry &&
        expiry > now &&
        expiry <= horizon
      ) {
        expiring.push({
          userId: user._id,
          name: user.name,
          email: user.email,
          plan: purchase.plan,
          planExpiryDate: purchase.planExpiryDate,
        });
      }
    }
  }

  expiring.sort(
    (a, b) =>
      new Date(a.planExpiryDate).getTime() - new Date(b.planExpiryDate).getTime()
  );

  return ok({ expiring }, { days });
});
