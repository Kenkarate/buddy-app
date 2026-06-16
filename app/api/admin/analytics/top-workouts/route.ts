import { NextRequest } from "next/server";
import { WorkoutEvent } from "@/models/WorkoutEvent";
import { ok, withErrorHandler } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);

  const rows = await WorkoutEvent.aggregate([
    {
      $group: {
        _id: "$workoutName",
        views: {
          $sum: { $cond: [{ $eq: ["$eventType", "view"] }, 1, 0] },
        },
        completions: {
          $sum: { $cond: [{ $in: ["$eventType", ["complete", "checked"]] }, 1, 0] },
        },
      },
    },
    { $sort: { views: -1, completions: -1 } },
    { $limit: 10 },
  ]);

  return ok({
    workouts: rows.map((row: any) => ({
      name: row._id,
      views: row.views,
      completions: row.completions,
    })),
  });
});
