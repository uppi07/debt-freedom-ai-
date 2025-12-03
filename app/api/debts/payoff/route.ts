import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Debt from "@/models/Debt";

export async function POST(request: NextRequest) {
  await connectDB();

  try {
    const body = await request.json();
    const id = body?.id;
    if (!id) {
      return NextResponse.json({ error: "MISSING_ID" }, { status: 400 });
    }

    const debt = await Debt.findById(id);
    if (!debt) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const payAmount = Number(body?.amount ?? debt.amount ?? 0);
    debt.totalPaid = (debt.totalPaid ?? 0) + payAmount;
    debt.amount = 0;
    debt.cleared = true;
    debt.payoffDate = new Date();
    debt.amountSaved = debt.amountSaved ?? 0;

    await debt.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PAYOFF ERROR:", error);
    return NextResponse.json({ error: "PAYOFF_FAILED" }, { status: 500 });
  }
}
