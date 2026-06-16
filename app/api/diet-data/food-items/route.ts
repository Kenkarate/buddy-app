import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { FoodItem } from "@/models/FoodItem";
import { readJson } from "@/lib/http";
import { getAuthIdFromRequest, getUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = getAuthIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  await connectDB();
  const items = await FoodItem.find({ isActive: true });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ message: "Admin access only" }, { status: 403 });
  }

  const body = await readJson<Record<string, unknown>>(req);
  const item = await FoodItem.create(body);
  return NextResponse.json(item, { status: 201 });
}
