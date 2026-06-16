import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { DietPlan } from "@/models/DietPlan";
import { readJson } from "@/lib/http";
import { getUserFromRequest } from "@/lib/auth";

async function requireAdminRaw(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ message: "Admin access only" }, { status: 403 });
  }
  return null;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ goal: string }> }
) {
  const denied = await requireAdminRaw(req);
  if (denied) return denied;

  try {
    const { goal } = await params;

    if (!["cutting", "bulking"].includes(goal)) {
      return NextResponse.json(
        { message: "Diet type must be cutting or bulking" },
        { status: 400 }
      );
    }

    const body = await readJson<any>(req);

    await connectDB();
    await DietPlan.updateMany({ goal }, { isActive: false });

    const plan = await DietPlan.findOneAndUpdate(
      { goal, title: body.title || `${goal} Diet` },
      {
        title:
          body.title || (goal === "cutting" ? "Cutting Diet" : "Bulking Diet"),
        goal,
        baseWeight: Number(body.baseWeight || 70),
        targetCalories: Number(body.targetCalories || 0),
        minCalories: Number(body.targetCalories || 0),
        maxCalories: Number(body.targetCalories || 0),
        meals: Array.isArray(body.meals) ? body.meals : [],
        notes: body.notes || "",
        isActive: true,
      },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json(plan);
  } catch (error) {
    console.error("SAVE BASE DIET PLAN ERROR:", error);
    return NextResponse.json(
      { message: (error as Error).message || "Failed to save diet plan" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ goal: string }> }
) {
  const denied = await requireAdminRaw(req);
  if (denied) return denied;

  try {
    const { goal } = await params;

    if (!["cutting", "bulking"].includes(goal)) {
      return NextResponse.json(
        { message: "Diet type must be cutting or bulking" },
        { status: 400 }
      );
    }

    await connectDB();
    await DietPlan.updateMany({ goal, isActive: true }, { isActive: false });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE BASE DIET PLAN ERROR:", error);
    return NextResponse.json(
      { message: (error as Error).message || "Failed to delete diet plan" },
      { status: 500 }
    );
  }
}
