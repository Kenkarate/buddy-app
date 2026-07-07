import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getOrCreateSettings } from "@/lib/appSettings";
import { getAuthIdFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = getAuthIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const settings = await getOrCreateSettings();
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json(
      { message: "Failed to load settings" },
      { status: 500 }
    );
  }
}
