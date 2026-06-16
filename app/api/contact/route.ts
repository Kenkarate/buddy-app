import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ContactIssue } from "@/models/ContactIssue";
import { readJson } from "@/lib/http";
import { getAuthIdFromRequest, getUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = getAuthIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  const body = await readJson<Record<string, unknown>>(req);

  await connectDB();
  const issue = await ContactIssue.create({ userId, ...body });

  return NextResponse.json(issue, { status: 201 });
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ message: "Admin access only" }, { status: 403 });
  }

  const issues = await ContactIssue.find().sort({ createdAt: -1 });
  return NextResponse.json(issues);
}
