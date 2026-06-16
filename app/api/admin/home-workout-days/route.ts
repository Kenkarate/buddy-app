import { NextRequest } from "next/server";
import { HomeWorkoutDay } from "@/models/HomeWorkoutDay";
import { ok, withErrorHandler } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET all 30 numbered days that have been built.
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  const days = await HomeWorkoutDay.find().sort({ day: 1 });
  return ok({ days });
});
