import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { readJson } from "@/lib/http";
import { getUserFromRequest, getAuthIdFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }
  return NextResponse.json(user.weightRecords);
}

export async function POST(req: NextRequest) {
  const userId = getAuthIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  const { weight } = await readJson<{ weight?: number }>(req);

  await connectDB();
  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  user.weightRecords.push({ weight, date: new Date() });
  user.weight = weight;
  await user.save();

  return NextResponse.json(user.weightRecords);
}
