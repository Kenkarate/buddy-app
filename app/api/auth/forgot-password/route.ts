import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { readJson } from "@/lib/http";
import { sendPasswordResetEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  // Always respond with the same generic message regardless of whether the
  // email exists, so this endpoint can't be used to enumerate accounts.
  const genericResponse = {
    message:
      "If an account exists for that email, a password reset link has been sent. The link expires in 15 minutes.",
  };

  try {
    const body = await readJson<{ email?: string }>(req);
    const email = body?.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(genericResponse);
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

    await user.save();

    const frontendUrl =
      process.env.FRONTEND_URL || "https://curious-vacherin-a5e583.netlify.app";

    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

    // The reset link is delivered by email only. It is never returned in the
    // response, otherwise anyone could reset another user's password.
    await sendPasswordResetEmail(email, resetLink);

    return NextResponse.json(genericResponse);
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return NextResponse.json(
      { message: "Forgot password failed" },
      { status: 500 }
    );
  }
}
