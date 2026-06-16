import { NextRequest } from "next/server";
import { User } from "@/models/User";
import { ok, AppError, withErrorHandler } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(
  async (req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) => {
    await requireAdmin(req);
    const { clientId } = await params;
    const client = await User.findById(clientId).select("-password");
    if (!client) {
      throw new AppError("Client not found", 404, "NOT_FOUND");
    }
    return ok(client);
  }
);
