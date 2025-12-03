import {connectDB} from "@/lib/db";
import Debt from "@/models/Debt";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  await connectDB();

  try {
    const body = await req.json();

    const debt = await Debt.create({
      name: body.name,
      amount: Number(body.amount),
      originalAmount: Number(body.amount),
      interest: Number(body.interest),
      minimumPayment: Number(body.minimumPayment),
      priority: body.priority ?? 1,
      paymentType: body.paymentType === "one-time" ? "one-time" : "recurring",
    });

    return NextResponse.json({ success: true, debt });
  } catch (error) {
    console.error("POST ERROR:", error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function GET() {
  await connectDB();

  try {
    const debts = await Debt.find({
      cleared: { $ne: true },
      amount: { $gt: 0 },
    });
    return NextResponse.json(debts);
  } catch (error) {
    console.error("GET ERROR:", error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
