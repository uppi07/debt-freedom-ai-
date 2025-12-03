"use client";

import { useMemo, useState, useEffect } from "react";
import { RepaymentMode, usePlan } from "@/lib/hooks/usePlan";

type ClearedDebt = {
  name: string;
  clearedMonth: number;
  totalPaid?: number;
  payoffDate?: string | null;
  amountSaved?: number;
};

export default function Dashboard() {
  const [mode] = useState<RepaymentMode>("Avalanche");
  const { plan, loading, error } = usePlan(mode);

  const [clearedOverride, setClearedOverride] = useState<ClearedDebt[] | null>(null);
  const [clearing, setClearing] = useState(false);

  /* ⭐ STEP 1 — Fix: Initialize clearedOverride when plan loads */
  useEffect(() => {
    if (plan?.clearedDebts && !clearedOverride) {
      setClearedOverride(plan.clearedDebts);
    }
  }, [plan]);

  /* ⭐ STEP 2 — Delete one debt permanently */
  async function deleteClearedDebt(name: string) {
    try {
      // DELETE FROM BACKEND
      await fetch("/api/cleared/delete", {
        method: "POST",
        body: JSON.stringify({ name }),
      });

      // UPDATE UI
      setClearedOverride((prev) => prev?.filter((d) => d.name !== name) ?? []);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  const metrics = useMemo(() => {
    const currency = plan?.currency || "INR";
    const formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    const timeline = plan?.timeline ?? [];
    const first = timeline[0] ?? {};

    const principal = plan?.totalPrincipal ?? 0;
    const totalInterest = plan?.totalFutureInterest ?? plan?.interestPaid ?? 0;
    const totalDebt = plan?.totalDebt ?? principal + totalInterest;

    const monthlyPayment = first?.totalPayment ?? 0;
    const monthsNeeded = plan?.months ?? timeline.length ?? 0;

    const clearedList = clearedOverride ?? plan?.clearedDebts ?? [];

    return {
      formatter,
      totalPrincipal: principal,
      totalInterest,
      totalDebt,
      monthlyPayment,
      monthsNeeded,
      clearedDebts: clearedList,
    };
  }, [plan, clearedOverride]);

  const hasCleared = metrics.clearedDebts.length > 0;
  const hasData = !error && (plan?.timeline?.length ?? 0) > 0;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <section className="bg-[#11121a] border border-[#1f2235] p-6 rounded-2xl shadow-lg shadow-black/30 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, Upendra 👋</h1>
          <p className="text-gray-400">Here’s your debt-free progress so far.</p>
        </div>
      </section>

      {/* CLEARED DEBTS SECTION */}
      {hasCleared && (
        <section className="bg-[#11121a] border border-[#1f2235] p-6 rounded-2xl shadow-lg shadow-black/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Debts Cleared</h2>
            <button
              onClick={() => setClearedOverride([])}
              disabled={!metrics.clearedDebts.length}
              className="text-xs px-3 py-1 rounded-full bg-white/10 text-gray-200 border border-white/10 hover:bg-white/20 disabled:opacity-40"
            >
              Clear List
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-white/5">
                  <th className="px-4 py-2">Debt</th>
                  <th className="px-4 py-2">Cleared Month</th>
                  <th className="px-4 py-2">Payoff Date</th>
                  <th className="px-4 py-2">Total Paid</th>
                  <th className="px-4 py-2">Amount Saved</th>
                  <th className="px-4 py-2">Action</th>
                </tr>
              </thead>

              <tbody>
                {metrics.clearedDebts.map((d, idx) => (
                  <tr key={idx} className="border-b border-white/5">
                    <td className="px-4 py-2 text-white">{d.name}</td>
                    <td className="px-4 py-2 text-gray-300">{d.clearedMonth}</td>
                    <td className="px-4 py-2 text-gray-300">
                      {d.payoffDate ? new Date(d.payoffDate).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-2 text-gray-300">
                      {metrics.formatter.format(d.totalPaid ?? 0)}
                    </td>
                    <td className="px-4 py-2 text-gray-300">
                      {metrics.formatter.format(d.amountSaved ?? 0)}
                    </td>

                    {/* ⭐ DELETE ONE ROW */}
                    <td className="px-4 py-2">
                      <button
                        onClick={() => deleteClearedDebt(d.name)}
                        className="px-3 py-1 text-xs rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </section>
      )}

      {/* STATS */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Total Principal" value={metrics.formatter.format(metrics.totalPrincipal)} />
        <Card title="Future Interest" value={metrics.formatter.format(metrics.totalInterest)} />
        <Card title="Total Debt" value={metrics.formatter.format(metrics.totalDebt)} />
        <Card title="Months Needed" value={String(metrics.monthsNeeded)} />
      </section>
    </div>
  );
}

/* CARD COMPONENT */
function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-[#11121a] border border-[#1f2235] p-5 rounded-2xl shadow-lg shadow-black/30">
      <p className="text-gray-400 text-sm">{title}</p>
      <p className="text-2xl text-white font-semibold mt-2">{value}</p>
    </div>
  );
}
