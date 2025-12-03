import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Debt from "@/models/Debt";
import Income from "@/models/Income";
import Expense from "@/models/Expense";
import { simulateAvalanche, simulateSnowball, type DebtInput, type SimulationResult } from "@/lib/simulations";

const toMoney = (value: number) => Number((value ?? 0).toFixed(2));

type DebtDoc = {
  name: string;
  amount: number;
  interest: number;
  minimumPayment: number;
  paymentType?: string;
  cleared?: boolean;
  totalPaid?: number;
  payoffDate?: Date | null;
  amountSaved?: number;
  totalMonths?: number | null;
  originalAmount?: number | null;
  save: () => Promise<unknown>;
};

export async function POST(request: NextRequest) {
  await connectDB();

  const body = await request.json().catch(() => ({}));
  const mode = body?.mode === "Snowball" ? "Snowball" : "Avalanche";

  const debts: DebtDoc[] = await Debt.find();
  if (!debts.length) {
    return NextResponse.json({ error: "NO_DEBTS" });
  }

  const incomes = await Income.find();
  const expenses = await Expense.find();
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const surplus = toMoney(totalIncome - totalExpenses);

  if (surplus <= 0) {
    return NextResponse.json({
      error: "NO_SURPLUS",
      message: "Increase income or reduce expenses.",
    });
  }

  const totalMinimum = debts.reduce(
    (sum, d) => (d.amount > 0 ? sum + (d.paymentType === "one-time" ? d.amount : d.minimumPayment) : sum),
    0
  );
  if (surplus < totalMinimum) {
    return NextResponse.json({
      error: "INSUFFICIENT_SURPLUS",
      required: toMoney(totalMinimum),
      surplus,
    });
  }

  // Step 1: apply monthly interest
  debts.forEach((d) => {
    if (d.amount <= 0) return;
    const interest = (d.amount * (d.interest / 100)) / 12;
    d.amount = toMoney(d.amount + interest);
  });

  const computePlannedTotal = (d: DebtDoc) => {
    if (d.paymentType === "one-time") {
      return toMoney(d.amount ?? 0);
    }
    const minPay = d.minimumPayment ?? 0;
    const apr = d.interest ?? 0;
    let balance = d.originalAmount ?? d.amount ?? 0;
    let total = 0;
    let month = 0;
    while (balance > 0 && month < 600) {
      month++;
      const interest = (balance * (apr / 100)) / 12;
      balance = balance + interest;
      const pay = Math.min(minPay, balance);
      total += pay;
      balance -= pay;
    }
    return toMoney(total);
  };

  const computeAmountSaved = (d: DebtDoc) => {
    const plannedTotal = computePlannedTotal(d);
    const actualPaid = d.totalPaid ?? 0;
    return toMoney(Math.max(plannedTotal - actualPaid, 0));
  };

  // Step 2: pay minimums
  const perDebtMin = new Map<string, number>();
  debts.forEach((d) => {
    if (d.amount <= 0) return;
    const pay = Math.min(d.paymentType === "one-time" ? d.amount : d.minimumPayment, d.amount);
    d.amount = toMoney(Math.max(d.amount - pay, 0));
    perDebtMin.set(d.name, pay);
  });

  // Step 3: apply leftover to target debt
  const remainingSurplus = toMoney(surplus - totalMinimum);
  if (remainingSurplus < 0) {
    return NextResponse.json({
      error: "INSUFFICIENT_SURPLUS",
      required: toMoney(totalMinimum),
      surplus,
    });
  }

  const perDebtExtra = new Map<string, number>();
  if (remainingSurplus > 0) {
    const open = debts.filter((d) => d.amount > 0);
    if (open.length) {
      const target =
        mode === "Snowball"
          ? open.sort((a, b) => a.amount - b.amount)[0]
          : open.sort((a, b) => b.interest - a.interest)[0];
      const extraPay = Math.min(remainingSurplus, target.amount);
      target.amount = toMoney(Math.max(target.amount - extraPay, 0));
      perDebtExtra.set(target.name, extraPay);
    }
  }

  // Track payments applied this cycle
  debts.forEach((d) => {
    const paid = (perDebtMin.get(d.name) ?? 0) + (perDebtExtra.get(d.name) ?? 0);
    d.totalPaid = toMoney((d.totalPaid ?? 0) + paid);
  });

  const clearedNow = debts.filter((d) => d.amount <= 0);
  const activeDebts = debts.filter((d) => d.amount > 0);

  // Save updated principals and mark cleared
  await Promise.all(
    debts.map((d) => {
      if (d.amount <= 0) {
        d.amount = 0;
        d.cleared = true;
        d.payoffDate = new Date();
        d.amountSaved = computeAmountSaved(d);
      }
      return d.save();
    })
  );

  const normalizedDebts: DebtInput[] = activeDebts.map((d) => ({
    name: d.name,
    amount: toMoney(d.amount),
    interest: d.interest,
    minimumPayment: d.minimumPayment,
    paymentType: d.paymentType,
  }));

  if (normalizedDebts.length === 0) {
    const totalPrincipal = 0;
    const futureInterest = 0;
    const result = {
      strategy: mode,
      months: 0,
      interestPaid: 0,
      timeline: [],
      bestStrategy: mode,
      currency: "INR",
      totalPrincipal,
      totalFutureInterest: futureInterest,
      totalDebt: 0,
      clearedDebts: clearedNow.map((d) => ({
        name: d.name,
        clearedMonth: 0,
        totalPaid: d.totalPaid ?? 0,
        payoffDate: d.payoffDate ?? null,
        amountSaved: d.amountSaved ?? 0,
      })),
    };
    return NextResponse.json(result);
  }

  const plan: SimulationResult =
    mode === "Snowball" ? simulateSnowball(normalizedDebts, surplus) : simulateAvalanche(normalizedDebts, surplus);

  if ("error" in plan) {
    return NextResponse.json(plan);
  }

  const totalPrincipal = toMoney(
    normalizedDebts.reduce((sum, d) => sum + (d.amount ?? 0), 0)
  );
  const futureInterest = toMoney(plan.interestPaid ?? 0);

  const clearedMerged = [
    ...(plan.clearedDebts ?? []),
    ...clearedNow.map((d) => ({
      name: d.name,
      clearedMonth: 0,
      totalPaid: d.totalPaid ?? 0,
      payoffDate: d.payoffDate ?? null,
      amountSaved: d.amountSaved ?? computeAmountSaved(d),
    })),
  ].filter(
    (d) =>
      !(
        (d.name?.toLowerCase?.() === "loan" || d.name === "loan") &&
        (d.clearedMonth ?? 0) === 0 &&
        (d.totalPaid ?? 0) === 0 &&
        (d.amountSaved ?? 0) === 0
      )
  );

  const result = {
    ...plan,
    bestStrategy: plan.strategy ?? mode,
    currency: "INR",
    totalPrincipal,
    totalFutureInterest: futureInterest,
    totalDebt: toMoney(totalPrincipal + futureInterest),
    clearedDebts: clearedMerged,
  };

  return NextResponse.json(result);
}
