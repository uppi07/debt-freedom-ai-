import { connectDB } from "@/lib/db";
import Income from "@/models/Income";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  await connectDB();
  try {
    const body = await req.json();
    const income = await Income.create({
      source: body.source,
      amount: Number(body.amount),
    });

    return NextResponse.json({ success: true, income });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function GET() {
  await connectDB();
  try {
    const incomes = await Income.find();
    return NextResponse.json(incomes);
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
