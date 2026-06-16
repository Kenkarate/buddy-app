import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { readJson } from "@/lib/http";
import { getAuthIdFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = getAuthIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(userId).select("-password");
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const userId = getAuthIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  const { age, height, weight, goal } = await readJson<{
    age?: number;
    height?: number;
    weight?: number;
    goal?: string;
  }>(req);

  await connectDB();
  const user = await User.findByIdAndUpdate(
    userId,
    { age, height, weight, goal },
    { new: true }
  ).select("-password");

  return NextResponse.json(user);
}
