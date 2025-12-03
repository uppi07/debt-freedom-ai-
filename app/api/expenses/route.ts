import { connectDB } from "@/lib/db";
import Expense from "@/models/Expense";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  await connectDB();
  try {
    const body = await req.json();
    const expense = await Expense.create({
      category: body.category,
      amount: Number(body.amount),
    });

    return NextResponse.json({ success: true, expense });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function GET() {
  await connectDB();
  try {
    const expenses = await Expense.find();
    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
