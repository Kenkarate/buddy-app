import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { readJson } from "@/lib/http";
import { getAuthIdFromRequest } from "@/lib/auth";
import { getSelectedPlan, buildAccessPayload, planPrices } from "@/lib/payments";

export async function POST(req: NextRequest) {
  const userId = getAuthIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  try {
    const body = await readJson<Record<string, unknown>>(req);
    const { normalizedProgram, selectedPlan } = getSelectedPlan(
      body.program || body.plan || body.planKey
    );

    if (!selectedPlan) {
      return NextResponse.json(
        {
          message: "Invalid plan selection",
          receivedProgram: body.program || body.plan || body.planKey,
          normalizedProgram,
          allowedPlans: Object.keys(planPrices),
        },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findByIdAndUpdate(
      userId,
      {
        selectedPlan: selectedPlan.finalProgram,
        selectedProgram: selectedPlan.finalProgram,
      },
      { new: true }
    ).select("-password");

    return NextResponse.json(buildAccessPayload(user, selectedPlan.finalProgram));
  } catch (error) {
    console.error("SELECT PLAN ERROR:", error);
    return NextResponse.json(
      { message: (error as Error).message || "Failed to select plan" },
      { status: 500 }
    );
  }
}
