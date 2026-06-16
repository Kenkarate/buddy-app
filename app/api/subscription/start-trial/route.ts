import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { readJson } from "@/lib/http";
import { getAuthIdFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const userId = getAuthIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  const { selectedProgram } = await readJson<{ selectedProgram?: string }>(req);

  await connectDB();
  const user = await User.findByIdAndUpdate(
    userId,
    {
      selectedProgram,
      subscriptionStatus: "trial",
      trialStartedAt: new Date(),
    },
    { new: true }
  ).select("-password");

  return NextResponse.json(user);
}
