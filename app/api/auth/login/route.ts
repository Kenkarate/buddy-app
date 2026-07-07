import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { readJson } from "@/lib/http";
import { signToken, setAuthCookie } from "@/lib/auth";
import { serializeUser } from "@/lib/serializeUser";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await readJson<{
      email?: string;
      password?: string;
    }>(req);

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET missing");
      return NextResponse.json(
        { message: "Server JWT secret is missing" },
        { status: 500 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    await connectDB();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.password) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 400 }
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 400 }
      );
    }

    const token = signToken(String(user._id));
    await setAuthCookie(token);

    return NextResponse.json({ token, user: serializeUser(user) });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json({ message: "Login failed" }, { status: 500 });
  }
}
