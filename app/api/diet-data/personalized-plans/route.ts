import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { DietPlan } from "@/models/DietPlan";
import { User } from "@/models/User";
import { getLatestWeight, scalePlan } from "@/lib/diet";
import { getAuthIdFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = getAuthIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const [user, plans] = await Promise.all([
      User.findById(userId).select("weight weightRecords"),
      DietPlan.find({
        goal: { $in: ["cutting", "bulking"] },
        isActive: true,
      }).sort({ goal: 1 }),
    ]);

    const userWeight = getLatestWeight(user);

    return NextResponse.json({
      userWeight,
      plans: plans.map((plan) => scalePlan(plan, userWeight)),
    });
  } catch (error) {
    console.error("LOAD PERSONALIZED DIET PLANS ERROR:", error);
    return NextResponse.json(
      { message: "Failed to load personalized diet plans" },
      { status: 500 }
    );
  }
}
