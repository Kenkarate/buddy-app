import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ContactIssue } from "@/models/ContactIssue";
import { readJson } from "@/lib/http";
import { getUserFromRequest } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ message: "Admin access only" }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await readJson<{ status?: string }>(req);

  if (!status || !["open", "in-progress", "closed"].includes(status)) {
    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  }

  await connectDB();
  const issue = await ContactIssue.findByIdAndUpdate(id, { status }, { new: true });

  if (!issue) {
    return NextResponse.json({ message: "Issue not found" }, { status: 404 });
  }

  return NextResponse.json(issue);
}
