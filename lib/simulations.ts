export type DebtInput = {
  name?: string;
  amount: number;
  interest: number; // APR %
  minimumPayment: number;
};

export type SimulationMode = "Avalanche" | "Snowball";

export type SimulationResult =
  | {
      strategy: SimulationMode;
      months: number;
      interestPaid: number;
      clearedDebts: {
        name: string;
        clearedMonth: number;
        totalPaid?: number;
        payoffDate?: string | null;
        amountSaved?: number;
      }[];
      timeline: {
        month: number;
        totalPayment: number;
        interest: number;
        remaining: number;
        breakdown: {
          name: string;
          minPayment: number;
          extraPayment: number;
          interest: number;
          remaining: number;
        }[];
      }[];
    }
  | { error: string; [key: string]: unknown };

// -------------------- BASIC UTILITIES --------------------

export function calculateMonthlyInterest(balance: number, apr: number) {
  if (balance <= 0 || apr <= 0) return 0;
  return (balance * (apr / 100)) / 12;
}

const toMoney = (v: number) => Number(v.toFixed(2));

// -------------------- PREPARE DEBTS --------------------

function prepareDebts(debts: DebtInput[]) {
  return debts.map((d) => ({
    name: d.name ?? "Debt",
    balance: Math.max(toMoney(d.amount), 0),
    apr: d.interest,
    min: d.minimumPayment,
  }));
}

function pickTarget(debts: ReturnType<typeof prepareDebts>) {
  const open = debts.filter((d) => d.balance > 0);
  if (open.length === 0) return null;
  return open.sort((a, b) => b.apr - a.apr)[0];
}

// -------------------- BANK-GRADE EMI SIMULATOR --------------------

export function simulateOriginalEmi(debt: DebtInput) {
  let balance = debt.amount;
  const apr = debt.interest;
  const monthlyRate = apr / 100 / 12;
  const emi = debt.minimumPayment;

  let totalInterest = 0;
  let month = 0;

  while (balance > 0 && month < 480) {
    month++;

    const interest = balance * monthlyRate;
    totalInterest += interest;

    let principalPay = emi - interest;
    if (principalPay < 0) principalPay = 0;

    balance -= principalPay;

    if (balance < 0.01) balance = 0;
  }

  return {
    months: month,
    interest: Number(totalInterest.toFixed(2)),
  };
}

// -------------------- MAIN EARLY-PAYOFF SIMULATION --------------------

function runSimulation(
  debts: DebtInput[],
  surplus: number,
  mode: SimulationMode
): SimulationResult {
  if (!debts || debts.length === 0) return { error: "NO_DEBTS" };

  let working = prepareDebts(debts);
  const cleared: { name: string; clearedMonth: number }[] = [];

  // Track per-debt interest (NEW FIX)
  const interestMap = new Map<string, number>();
  for (const d of debts) interestMap.set(d.name ?? "Debt", 0);

  working = working.filter((d) => {
    if (d.balance <= 0) {
      cleared.push({ name: d.name, clearedMonth: 0 });
      return false;
    }
    return true;
  });

  let month = 0;
  let totalInterest = 0;

  const timeline: {
    month: number;
    totalPayment: number;
    interest: number;
    remaining: number;
    breakdown: {
      name: string;
      minPayment: number;
      extraPayment: number;
      interest: number;
      remaining: number;
    }[];
  }[] = [];

  while (true) {
    month++;

    const perDebtInterest = new Map<string, number>();
    let monthlyInterest = 0;

    // Interest calculation
    for (const d of working) {
      const interest = calculateMonthlyInterest(d.balance, d.apr);
      perDebtInterest.set(d.name, interest);
      monthlyInterest += interest;
    }

    // Minimum payments
    const perDebtMin = new Map<string, number>();
    let totalMinimum = 0;

    for (const d of working) {
      const interest = perDebtInterest.get(d.name)!;
      const minPay = Math.min(d.min, d.balance + interest);
      perDebtMin.set(d.name, minPay);
      totalMinimum += minPay;
    }

    if (surplus < totalMinimum)
      return { error: "INSUFFICIENT_SURPLUS", surplus, required: totalMinimum };

    let totalPaymentThisMonth = 0;

    // Apply minimum payments
    for (const d of working) {
      const interest = perDebtInterest.get(d.name)!;
      const minPay = perDebtMin.get(d.name)!;

      const principalPay = Math.max(minPay - interest, 0);
      d.balance = Math.max(d.balance - principalPay, 0);

      totalInterest += interest;
      totalPaymentThisMonth += minPay;

      // NEW: track per-debt interest
      const old = interestMap.get(d.name) ?? 0;
      interestMap.set(d.name, old + interest);
    }

    // Extra target payment
    const extraMap = new Map<string, number>();
    const remainingSurplus = surplus - totalMinimum;

    if (remainingSurplus > 0) {
      const target = pickTarget(working);
      if (target) {
        const extra = Math.min(remainingSurplus, target.balance);
        target.balance -= extra;
        extraMap.set(target.name, extra);
        totalPaymentThisMonth += extra;
      }
    }

    const remainingBalance = working.reduce(
      (sum, d) => sum + d.balance,
      0
    );

    timeline.push({
      month,
      totalPayment: toMoney(totalPaymentThisMonth),
      interest: toMoney(monthlyInterest),
      remaining: toMoney(remainingBalance),
      breakdown: working.map((d) => ({
        name: d.name,
        minPayment: toMoney(perDebtMin.get(d.name)!),
        extraPayment: toMoney(extraMap.get(d.name) ?? 0),
        interest: toMoney(perDebtInterest.get(d.name)!),
        remaining: toMoney(d.balance),
      })),
    });

    // Remove cleared debts
    const stillOpen = [];
    for (const d of working) {
      if (d.balance <= 0) {
        cleared.push({ name: d.name, clearedMonth: month });
      } else stillOpen.push(d);
    }
    working = stillOpen;

    // Finish
    if (remainingBalance <= 1 || working.length === 0) {
      const detailed = cleared.map((cd) => {
        const original = simulateOriginalEmi(
          debts.find((x) => x.name === cd.name)!
        );

        // FIX: use per-debt interest, not totalInterest
        const debtInterestPaid = Number(
          (interestMap.get(cd.name) ?? 0).toFixed(2)
        );

        const totalPaid = timeline
          .flatMap((t) =>
            t.breakdown
              .filter((b) => b.name === cd.name)
              .map((b) => b.minPayment + b.extraPayment)
          )
          .reduce((a, b) => a + b, 0);

        const amountSaved = Number(
          (original.interest - debtInterestPaid).toFixed(2)
        );

        return {
          name: cd.name,
          clearedMonth: cd.clearedMonth,
          totalPaid: Number(totalPaid.toFixed(2)),
          payoffDate: null,
          amountSaved,
        };
      });

      return {
        strategy: mode,
        months: month,
        interestPaid: Number(totalInterest.toFixed(2)),
        clearedDebts: detailed,
        timeline,
      };
    }
  }
}

// EXPORTS
export function simulateAvalanche(debts: DebtInput[], surplus: number) {
  return runSimulation(debts, surplus, "Avalanche");
}

export function simulateSnowball(debts: DebtInput[], surplus: number) {
  return runSimulation(debts, surplus, "Snowball");
}
