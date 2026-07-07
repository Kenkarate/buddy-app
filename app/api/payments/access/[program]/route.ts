import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getAuthIdFromRequest } from "@/lib/auth";
import { getSelectedPlan, buildAccessPayload } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ program: string }> }
) {
  const userId = getAuthIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  try {
    const { program } = await params;
    const { normalizedProgram, selectedPlan } = getSelectedPlan(program);

    if (!selectedPlan) {
      return NextResponse.json(
        { message: "Invalid plan", normalizedProgram },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findById(userId).select("-password");
    return NextResponse.json(buildAccessPayload(user, selectedPlan.finalProgram));
  } catch (error) {
    console.error("CHECK PLAN ACCESS ERROR:", error);
    return NextResponse.json(
      { message: (error as Error).message || "Failed to check access" },
      { status: 500 }
    );
  }
}
