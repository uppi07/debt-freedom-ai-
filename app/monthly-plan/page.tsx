"use client";

import React, { useEffect, useMemo, useState } from "react";
import { emitPlanChangeSignal } from "@/lib/hooks/usePlan";

type TimelineRow = {
  month: number;
  totalPayment: number;
  interest: number;
  remaining: number;
  breakdown?: {
    name: string;
    minPayment: number;
    extraPayment: number;
    interest: number;
    remaining: number;
  }[];
  paid?: boolean;
};

type PlanData = {
  bestStrategy?: string;
  currency?: string;
  months?: number;
  interestPaid?: number;
  totalPrincipal?: number;
  totalFutureInterest?: number;
  totalDebt?: number;
  timeline?: TimelineRow[];
  warnings?: string[];
};

export default function MonthlyPlanPage() {
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [oneTimeDebts, setOneTimeDebts] = useState<{ _id: string; name: string; amount: number; interest: number }[]>(
    []
  );
  const [paidRows, setPaidRows] = useState<TimelineRow[]>([]);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPlan() {
    const res = await fetch("/api/plan", { cache: "no-store" });
    const data = (await res.json()) as PlanData;
    setPlan(data);
    setPaidRows([]);
  }

  async function loadOneTimeDebts() {
    try {
      const res = await fetch("/api/debts", { cache: "no-store" });
      const debts = (await res.json()) as {
        _id?: string;
        id?: string;
        name?: string;
        amount?: number;
        interest?: number;
        paymentType?: string;
      }[];
      const filtered =
        debts?.filter?.((d) => d?.paymentType === "one-time" && (d?.amount ?? 0) > 0) ??
        [];
      setOneTimeDebts(
        filtered.map((d) => ({
          _id: d._id || d.id || "",
          name: d.name,
          amount: Number(d.amount) || 0,
          interest: Number(d.interest) || 0,
        }))
      );
    } catch {
      setOneTimeDebts([]);
    }
  }

  useEffect(() => {
    void loadPlan();
    void loadOneTimeDebts();
  }, []);

  const { totalPlanned } = useMemo(() => {
    if (!plan?.timeline) return { totalPlanned: 0 };
    const total = plan.timeline.reduce((sum: number, m: TimelineRow) => sum + (m.totalPayment ?? 0), 0);
    return { totalPlanned: total };
  }, [plan]);

  async function markPaid() {
    if (!plan || !plan.timeline || plan.timeline.length === 0) return;
    setPaying(true);
    setError(null);

    // take the first unpaid month from current plan
    const timeline = plan.timeline;
    const unpaidIndex = timeline.findIndex((m) => !m.paid);
    const paidIndex = unpaidIndex === -1 ? 0 : unpaidIndex;
    const paidRow = { ...timeline[paidIndex], paid: true };

    try {
      const res = await fetch("/api/plan/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: plan.bestStrategy || "Avalanche" }),
      });
      const data = (await res.json()) as PlanData & { error?: string; message?: string };
      if (!res.ok || data.error) {
        setError(data?.message || data?.error || "Unable to record payment");
      } else {
        const baseMonth = paidRow.month + 1;
        const nextTimeline =
          data.timeline?.map((row, idx) => ({
            ...row,
            month: baseMonth + idx,
            paid: false,
          })) ?? [];

        const updatedPaid = [...paidRows, paidRow];

        setPaidRows(updatedPaid);
        setPlan({
          ...plan,
          ...data,
          timeline: [...updatedPaid, ...nextTimeline],
        });
        emitPlanChangeSignal();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to record payment";
      setError(message);
    } finally {
      setPaying(false);
    }
  }

  async function markOneTimePaid(id: string, amount: number) {
    if (!id) {
      setError("Unable to record payoff: missing debt id");
      return;
    }
    setPaying(true);
    setError(null);
    try {
      const res = await fetch("/api/debts/payoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, amount }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data?.error || "Unable to record payoff");
      } else {
        await loadPlan();
        await loadOneTimeDebts();
        emitPlanChangeSignal();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to record payoff";
      setError(message);
    } finally {
      setPaying(false);
    }
  }

  if (!plan) {
    return <p className="text-gray-200 px-4 py-8 sm:p-10">Loading...</p>;
  }

  const currency = plan?.currency || "INR";
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 text-gray-100 space-y-6 max-w-6xl mx-auto w-full">
      {plan.warnings?.length ? (
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-100 text-sm rounded-xl px-4 py-3">
          {plan.warnings.map((w, idx) => (
            <div key={idx}>{w}</div>
          ))}
        </div>
      ) : null}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Your Payment Plan</h1>
          <p className="text-gray-400">Confirm each month&apos;s payment so we don&apos;t over-assume payments.</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card label="Strategy" value={plan.bestStrategy} />
        <Card label="Months Needed" value={plan.months} />
        <Card label="Total Principal" value={formatter.format(Number(plan.totalPrincipal) || 0)} />
        <Card label="Total Future Interest" value={formatter.format(Number(plan.totalFutureInterest) || 0)} />
        <Card label="Total Debt" value={formatter.format(Number(plan.totalDebt) || 0)} />
        <Card label="Planned Total Payments" value={formatter.format(totalPlanned)} />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* One-time payoffs */}
      <div className="bg-[#11121a] border border-[#1f2235] rounded-2xl shadow-lg shadow-black/30">
        <div className="px-6 py-4 border-b border-[#1f2235]">
          <h2 className="text-lg font-semibold text-white">One-time Payoffs</h2>
          <p className="text-sm text-gray-400">Lump-sum debts requiring a single payoff.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm text-left">
            <thead>
              <tr className="border-b border-[#1f2235] text-gray-400">
                <th className="px-6 py-3">Debt</th>
                <th className="px-6 py-3">Payment</th>
                <th className="px-6 py-3">Interest (this month)</th>
                <th className="px-6 py-3">Excess Amount</th>
                <th className="px-6 py-3 text-center">Paid?</th>
              </tr>
            </thead>
            <tbody>
              {oneTimeDebts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-3 text-gray-500">
                    No one-time payoffs pending.
                  </td>
                </tr>
              )}
              {oneTimeDebts.map((d, idx) => {
                const monthlyInterest = (d.amount * (d.interest / 100)) / 12;
                return (
                  <tr key={`${d.name}-${idx}`} className="border-b border-[#1f2235]">
                    <td className="px-6 py-3 text-white font-semibold">{d.name}</td>
                    <td className="px-6 py-3 text-white">{formatter.format(d.amount)}</td>
                    <td className="px-6 py-3 text-white">{formatter.format(monthlyInterest)}</td>
                    <td className="px-6 py-3 text-white">-</td>
                    <td className="px-6 py-3 text-center">
                      <button
                        className="px-3 py-1 rounded-full text-xs font-semibold border bg-white/5 text-gray-200 border-white/10 hover:bg-white/10 disabled:opacity-60"
                        onClick={() => markOneTimePaid(d._id, d.amount)}
                        disabled={paying}
                      >
                        {paying ? "Applying..." : "Mark Paid"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Checklist */}
      <div className="bg-[#11121a] border border-[#1f2235] rounded-2xl shadow-lg shadow-black/30">
        <div className="px-6 py-4 border-b border-[#1f2235]">
          <h2 className="text-lg font-semibold text-white">Monthly payments</h2>
          <p className="text-sm text-gray-400">
            Mark &quot;Paid&quot; only after you&apos;ve actually sent the payment. We&apos;ll keep pending amounts separate.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm text-left">
            <thead>
              <tr className="border-b border-[#1f2235] text-gray-400">
                <th className="px-6 py-3">Month</th>
                <th className="px-6 py-3">Payment</th>
                <th className="px-6 py-3">Interest</th>
                <th className="px-6 py-3">Planned Remaining</th>
                <th className="px-6 py-3 text-center">Paid?</th>
              </tr>
            </thead>
            <tbody>
              {plan.timeline?.map((m: TimelineRow, idx: number) => (
                <React.Fragment key={idx}>
                  <tr className="border-b border-[#1f2235]">
                    <td className="px-6 py-3 align-top">
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span>Month {m.month}</span>
                        {m.paid && (
                          <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-200 border border-green-500/40">
                            Paid
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-white align-top">{formatter.format(m.totalPayment)}</td>
                    <td className="px-6 py-3 text-white align-top">{formatter.format(m.interest)}</td>
                    <td className="px-6 py-3 text-white align-top">
                      {formatter.format(m.remaining ?? 0)}
                    </td>
                    <td className="px-6 py-3 text-center align-top">
                      <button
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          m.paid
                            ? "bg-green-500/15 text-green-200 border-green-500/40"
                            : "bg-white/5 text-gray-200 border-white/10"
                        } disabled:opacity-60`}
                        onClick={markPaid}
                        disabled={paying || m.paid}
                      >
                        {m.paid ? "Paid" : paying ? "Applying..." : "Mark Paid"}
                      </button>
                    </td>
                  </tr>
                  {m.breakdown?.length ? (
                    <tr className="border-b border-[#1f2235] last:border-0 bg-black/20">
                      <td colSpan={5} className="px-6 py-3">
                        <div className="text-xs text-gray-400 mb-2">Per-debt breakdown</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {m.breakdown.map((b, i) => (
                            <div
                              key={`${b.name}-${i}`}
                              className="rounded-xl border border-white/5 bg-white/5 p-3 text-sm text-gray-200"
                            >
                              <div className="font-semibold text-white">{b.name}</div>
                              <div className="text-gray-400">Interest: {formatter.format(b.interest)}</div>
                              <div className="text-gray-400">
                                Min: {formatter.format(b.minPayment)} · Extra: {formatter.format(b.extraPayment)}
                              </div>
                              <div className="text-gray-300">Remaining: {formatter.format(b.remaining)}</div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Small stat card
function Card({ label, value }: { label: string; value: string | number | React.ReactNode }) {
  return (
    <div className="bg-[#11121a] p-5 rounded-2xl border border-[#1f2235] shadow-lg shadow-black/30 text-center">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-2xl font-semibold text-white mt-1">{value}</p>
    </div>
  );
}
