import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Expense from "@/models/Expense";

type RouteContext = { params: { id: string } };

export async function PUT(req: Request, context: RouteContext) {
  await connectDB();

  const { id } = await context.params;   // ✅ FIXED
  const data = await req.json();

  const updated = await Expense.findByIdAndUpdate(id, data, { new: true });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, context: RouteContext) {
  await connectDB();

  const { id } = await context.params;   // ✅ FIXED

  await Expense.findByIdAndDelete(id);

  return NextResponse.json({ success: true });
}
