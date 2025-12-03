import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import DeletedClearedDebt from "@/models/DeletedClearedDebt";

export async function POST(req: Request) {
  await connectDB();

  try {
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ success: false, error: "NAME_REQUIRED" }, { status: 400 });
    }

    // Save deleted cleared debt name
    await DeletedClearedDebt.updateOne({ name }, { $set: { name } }, { upsert: true });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PERMANENT DELETE ERROR:", err);
    return NextResponse.json({ success: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
