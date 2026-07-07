import { NextRequest } from "next/server";
import { User } from "@/models/User";
import { ok, AppError, withErrorHandler } from "@/lib/apiResponse";
import { readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/auth";

export const POST = withErrorHandler(
  async (req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) => {
    await requireAdmin(req);
    const { clientId } = await params;
    const { bodyPart, title, description, sets, reps, videoUrl } =
      await readJson<Record<string, unknown>>(req);

    const client = await User.findById(clientId);
    if (!client) {
      throw new AppError("Client not found", 404, "NOT_FOUND");
    }

    client.assignedWorkouts.push({ bodyPart, title, description, sets, reps, videoUrl });
    await client.save();

    return ok(client.assignedWorkouts);
  }
);
