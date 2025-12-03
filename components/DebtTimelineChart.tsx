"use client";

import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  type TooltipItem,
} from "chart.js";
import { RepaymentMode } from "@/lib/hooks/usePlan";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip);

type TimelineEntry = {
  month: number;
  totalPayment: number;
  interest: number;
  remaining: number;
};

type PlanShape = {
  currency?: string;
  timeline?: TimelineEntry[];
};

type Props = {
  plan: PlanShape | null;
  loading: boolean;
  error: string | null;
  mode: RepaymentMode;
  onModeChange: (mode: RepaymentMode) => void;
};

export default function DebtTimelineChart({
  plan,
  loading,
  error,
  mode,
  onModeChange,
}: Props) {
  const currency = plan?.currency || "INR";

  const chartData = useMemo(() => {
    if (!plan?.timeline) return null;

    const formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    });

    const labels: string[] = [];
    const remaining: number[] = [];
    const cumulativeInterest: number[] = [];
    let runningInterest = 0;

    plan.timeline.forEach((entry) => {
      labels.push(`Month ${entry.month}`);

      const balance = Math.max(entry?.remaining ?? 0, 0);
      remaining.push(balance);

      runningInterest += entry?.interest ?? 0;
      cumulativeInterest.push(Math.max(Math.round(runningInterest), 0));
    });

    return {
      labels,
      datasets: [
        {
          label: "Remaining Balance",
          data: remaining,
          borderColor: "#4F46E5",
          backgroundColor: "rgba(79,70,229,0.1)",
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: false,
        },
        {
          label: "Total Interest Paid",
          data: cumulativeInterest,
          borderColor: "#FB923C",
          backgroundColor: "rgba(251,146,60,0.15)",
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: false,
        },
      ],
      formatter,
    };
  }, [plan, currency]);

  const options = useMemo(
    () => ({
      responsive: true,
      animation: {
        duration: 600,
        easing: "easeOutQuad",
      },
      interaction: {
        intersect: false,
        mode: "index" as const,
      },
      plugins: {
        legend: { display: true },
        tooltip: {
          callbacks: {
            label: (ctx: TooltipItem<"line">) => {
              const formatter =
                chartData?.formatter ??
                new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency,
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                });
              const entry = plan?.timeline?.[ctx.dataIndex];
              const interest = entry?.interest ?? 0;
              const payment = entry?.totalPayment ?? 0;
              const base = `${ctx.dataset.label}: ${formatter.format(ctx.parsed.y)}`;
              if (ctx.dataset.label === "Remaining Balance") {
                return `${base} | Payment: ${formatter.format(payment)} | Interest: ${formatter.format(
                  interest
                )}`;
              }
              return `${base} | Interest this month: ${formatter.format(interest)}`;
            },
          },
        },
      },
      scales: {
        y: {
          ticks: {
            callback: (value: number | string) => {
              const num = typeof value === "string" ? Number(value) : value;
              return (chartData?.formatter ??
                new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency,
                  maximumFractionDigits: 0,
                  minimumFractionDigits: 0,
                })).format(num);
            },
          },
          grid: { color: "rgba(0,0,0,0.06)" },
        },
        x: { grid: { display: false } },
      },
    }),
    [chartData, plan, currency]
  );

  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Debt-Free Timeline</h2>
          <p className="text-sm text-gray-700">
            Remaining balance vs cumulative interest
          </p>
        </div>
        <div className="inline-flex rounded-lg overflow-hidden border">
          <ModeButton
            active={mode === "Avalanche"}
            onClick={() => onModeChange("Avalanche")}
            label="Avalanche"
          />
          <ModeButton
            active={mode === "Snowball"}
            onClick={() => onModeChange("Snowball")}
            label="Snowball"
          />
        </div>
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading chart...</p>}
      {error && (
        <p className="text-gray-600 text-sm">
          No plan yet. Add debts, income, and expenses to see your repayment curve.
        </p>
      )}
      {!loading && !error && chartData && (
        <Line data={{ labels: chartData.labels, datasets: chartData.datasets }} options={options} />
      )}
      {!loading && !error && !chartData && (
        <p className="text-gray-500 text-sm">No plan data yet. Add debts, income, and expenses.</p>
      )}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      className={`px-4 py-2 text-sm font-medium ${
        active ? "bg-indigo-600 text-white" : "bg-white text-gray-700"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
