import { NextRequest } from "next/server";
import { User } from "@/models/User";
import { ok, withErrorHandler } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  const clients = await User.find({ role: "user" }).select("-password");
  return ok(clients);
});
