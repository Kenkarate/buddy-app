import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Exercise } from "@/models/Exercise";
import { readJson } from "@/lib/http";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ message: "Admin access only" }, { status: 403 });
  }

  const body = await readJson<Record<string, unknown>>(req);
  await connectDB();
  const exercise = await Exercise.create(body);
  return NextResponse.json(exercise, { status: 201 });
}
