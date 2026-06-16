import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { readJson } from "@/lib/http";
import { signToken, setAuthCookie } from "@/lib/auth";
import { serializeUser } from "@/lib/serializeUser";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await readJson<{
      name?: string;
      email?: string;
      password?: string;
    }>(req);

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    await connectDB();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name || normalizedEmail,
      email: normalizedEmail,
      password: hashedPassword,
      role: "user",
    });

    const token = signToken(String(user._id));
    await setAuthCookie(token);

    return NextResponse.json(
      { token, user: serializeUser(user) },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ message: "Registration failed" }, { status: 500 });
  }
}
