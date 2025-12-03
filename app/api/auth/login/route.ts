import { NextResponse } from "next/server";
import argon2 from "argon2";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { signToken, setAuthCookies, clearAuthCookies } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  await connectDB();
  try {
    const body = await req.json();
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");
    if (!email || !password) {
      return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) {
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const token = await signToken({ userId: user._id.toString(), role: user.role });
    const res = NextResponse.json({
      success: true,
      user: { id: user._id, email: user.email, name: user.name }
    });
    setAuthCookies(token, res);
    return res;
  } catch {
    const res = NextResponse.json({ error: "LOGIN_FAILED" }, { status: 500 });
    clearAuthCookies(res);
    return res;
  }
}
