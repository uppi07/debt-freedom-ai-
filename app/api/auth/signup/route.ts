import { NextResponse } from "next/server";
import argon2 from "argon2";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { signToken, setAuthCookies } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  await connectDB();
  try {
    const body = await req.json();
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");
    const name = String(body.name || "");

    if (!email || !password) {
      return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "USER_EXISTS" }, { status: 409 });
    }

    const passwordHash = await argon2.hash(password);
    const user = await User.create({ email, passwordHash, name });

    const token = await signToken({ userId: user._id.toString(), role: user.role });
    const res = NextResponse.json({
      success: true,
      user: { id: user._id, email: user.email, name: user.name },
    });
    setAuthCookies(token, res);
    return res;
  } catch {
    return NextResponse.json({ error: "SIGNUP_FAILED" }, { status: 500 });
  }
}
