import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Debt from "@/models/Debt";

// Delete all cleared debts (amount <= 0 or flagged cleared)
export async function DELETE() {
  await connectDB();

  try {
    await Debt.deleteMany({ $or: [{ cleared: true }, { amount: { $lte: 0 } }] });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE CLEARED ERROR:", error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
