import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { DietPlan } from "@/models/DietPlan";
import { getAuthIdFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = getAuthIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const plans = await DietPlan.find({
      goal: { $in: ["cutting", "bulking"] },
      isActive: true,
    }).sort({ goal: 1 });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("LOAD BASE DIET PLANS ERROR:", error);
    return NextResponse.json(
      { message: "Failed to load diet plans" },
      { status: 500 }
    );
  }
}
