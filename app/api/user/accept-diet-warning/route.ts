import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getAuthIdFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const userId = getAuthIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findByIdAndUpdate(
    userId,
    { dietWarningAccepted: true },
    { new: true }
  ).select("-password");

  return NextResponse.json(user);
}
