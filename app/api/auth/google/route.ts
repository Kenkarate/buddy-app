import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { readJson } from "@/lib/http";
import { signToken, setAuthCookie } from "@/lib/auth";
import { serializeUser } from "@/lib/serializeUser";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(req: NextRequest) {
  try {
    const { credential } = await readJson<{ credential?: string }>(req);

    if (!credential) {
      return NextResponse.json(
        { message: "Google credential is required" },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return NextResponse.json(
        { message: "Google Client ID missing" },
        { status: 500 }
      );
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const googleId = payload?.sub;
    const email = payload?.email?.trim().toLowerCase();
    const name = payload?.name || email;
    const avatarUrl = payload?.picture || "";

    if (!email) {
      return NextResponse.json({ message: "Google email missing" }, { status: 400 });
    }

    await connectDB();
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        password: `google-${googleId}`,
        role: "user",
        googleId,
        avatarUrl,
        authProvider: "google",
      });
    } else {
      user.googleId = user.googleId || googleId;
      user.avatarUrl = avatarUrl || user.avatarUrl;
      user.authProvider = user.authProvider || "email";
      await user.save();
    }

    const token = signToken(String(user._id));
    await setAuthCookie(token);

    return NextResponse.json({ token, user: serializeUser(user) });
  } catch (error) {
    console.error("GOOGLE LOGIN ERROR:", error);
    return NextResponse.json({ message: "Google login failed" }, { status: 500 });
  }
}
