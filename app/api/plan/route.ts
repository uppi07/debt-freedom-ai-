import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Debt from "@/models/Debt";
import Income from "@/models/Income";
import Expense from "@/models/Expense";
import DeletedClearedDebt from "@/models/DeletedClearedDebt";
import {
  simulateAvalanche,
  simulateSnowball,
  type DebtInput,
  type SimulationResult,
} from "@/lib/simulations";

const toMoney = (value: number) => Number((value ?? 0).toFixed(2));
type DebtLike = {
  amount?: number;
  originalAmount?: number | null;
  paymentType?: string;
  totalMonths?: number | null;
  minimumPayment?: number;
  totalPaid?: number;
};

// Compute EMI total (original interest)
const computePlannedTotal = (d: DebtLike) => {
  if (d.paymentType === "one-time") {
    return toMoney(d.amount ?? 0);
  }
  const minPay = d.minimumPayment ?? 0;
  const apr = d["interest"] ?? 0;

  let balance = d.originalAmount ?? d.amount ?? 0;
  let total = 0;
  let month = 0;

  while (balance > 0 && month < 600) {
    month++;
    const interest = (balance * (apr / 100)) / 12;
    balance += interest;
    const pay = Math.min(minPay, balance);
    total += pay;
    balance -= pay;
  }

  return toMoney(total);
};

// Amount saved
const computeAmountSaved = (d: DebtLike) => {
  const plannedTotal = computePlannedTotal(d);
  const actualPaid = d.totalPaid ?? 0;
  return toMoney(Math.max(plannedTotal - actualPaid, 0));
};

export async function GET(request: NextRequest) {
  await connectDB();

  const { searchParams } = new URL(request.url);
  const modeParam = searchParams.get("mode");
  const mode = modeParam === "Snowball" ? "Snowball" : "Avalanche";

  // DB reads
  const debts = await Debt.find();
  const incomes = await Income.find();
  const expenses = await Expense.find();
  const deletedCleared = await DeletedClearedDebt.find();
  const deletedNames = new Set(deletedCleared.map((d) => d.name));

  // Surplus
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const surplus = totalIncome - totalExpenses;

  if (surplus <= 0) {
    return NextResponse.json({
      error: "NO_SURPLUS",
      message: "Increase income or reduce expenses.",
    });
  }

  // Active debts
  const oneTimeActive = debts.filter(
    (d) => !d.cleared && d.amount > 0 && d.paymentType === "one-time"
  );

  const activeDebts = debts.filter(
    (d) =>
      !d.cleared &&
      d.amount > 0 &&
      (d.paymentType === "recurring" || !d.paymentType)
  );

  const oneTimeShortages = oneTimeActive
    .filter((d) => d.amount > surplus)
    .map((d) => ({
      name: d.name,
      shortage: toMoney(d.amount - surplus),
      amount: toMoney(d.amount),
    }));

  // Existing cleared debts from DB
  const clearedExisting = debts
    .filter((d) => d.cleared || d.amount <= 0)
    .map((d) => ({
      name: d.name,
      clearedMonth: 0,
      totalPaid: d.totalPaid ?? 0,
      payoffDate: d.payoffDate ?? null,
      amountSaved: computeAmountSaved(d),
    }))
    .filter((d) => !deletedNames.has(d.name)); // REMOVE DELETED

  // If no active debts
  if (activeDebts.length === 0) {
    const oneTimePrincipal = toMoney(
      oneTimeActive.reduce((sum, d) => sum + (d.amount ?? 0), 0)
    );
    return NextResponse.json({
      strategy: mode,
      months: 0,
      interestPaid: 0,
      timeline: [],
      bestStrategy: mode,
      currency: "INR",
      totalPrincipal: oneTimePrincipal,
      totalFutureInterest: 0,
      totalDebt: oneTimePrincipal,
      clearedDebts: clearedExisting,
    });
  }

  // Check minimums
  const totalMinimumPayments = activeDebts.reduce(
    (sum, d) => sum + d.minimumPayment,
    0
  );

  if (surplus < totalMinimumPayments) {
    return NextResponse.json({
      error: "INSUFFICIENT_SURPLUS",
      surplus,
      required: Math.round(totalMinimumPayments),
    });
  }

  // Simulation
  const debtInputs: DebtInput[] = activeDebts.map((d) => ({
    name: d.name,
    amount: d.amount,
    interest: d.interest,
    minimumPayment: d.minimumPayment,
  }));

  const plan: SimulationResult =
    mode === "Snowball"
      ? simulateSnowball(debtInputs, surplus)
      : simulateAvalanche(debtInputs, surplus);

  if ("error" in plan) return NextResponse.json(plan);

  const totalPrincipal = toMoney(
    activeDebts.reduce((sum, d) => sum + (d.amount ?? 0), 0) +
      oneTimeActive.reduce((sum, d) => sum + (d.amount ?? 0), 0)
  );

  const futureInterest = toMoney(plan.interestPaid ?? 0);

  // 🔥 FINAL MERGE — filter out deleted items from simulation
  const mergedSimCleared = (plan.clearedDebts ?? []).filter(
    (d) => !deletedNames.has(d.name)
  );

  const clearedDebts = [...clearedExisting, ...mergedSimCleared];

  return NextResponse.json({
    ...plan,
    bestStrategy: plan.strategy ?? mode,
    currency: "INR",
    totalPrincipal,
    totalFutureInterest: futureInterest,
    totalDebt: toMoney(totalPrincipal + futureInterest),
    clearedDebts,
  });
}
