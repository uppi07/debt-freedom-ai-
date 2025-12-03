"use client";

import { useState, useEffect, type ChangeEvent } from "react";
import { emitPlanChangeSignal } from "@/lib/hooks/usePlan";

// MY DEBTS CRUD PAGE – Add / Edit / Delete debts
type DebtItem = {
  _id: string;
  name: string;
  amount: number;
  interest: number;
  minimumPayment: number;
  paymentType?: string;
  totalMonths?: number | null;
};

export default function MyDebts() {
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [currency] = useState("INR");
  const [canAddDebts, setCanAddDebts] = useState(false);
  const [prereqChecked, setPrereqChecked] = useState(false);
  const [form, setForm] = useState({
    name: "",
    amount: "",
    interest: "",
    minimumPayment: "",
    paymentType: "recurring",
    totalMonths: "",
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    amount: "",
    interest: "",
    minimumPayment: "",
    paymentType: "recurring",
    totalMonths: "",
  });

  /* Load All Debts from API */
  async function loadDebts() {
    const res = await fetch("/api/debts");
    const data = await res.json();
    setDebts(data);
  }

  async function checkIncomeExpenses() {
    try {
      const [incomes, expenses] = await Promise.all([
        fetch("/api/income").then((r) => r.json()),
        fetch("/api/expenses").then((r) => r.json()),
      ]);
      const hasIncome = Array.isArray(incomes) && incomes.length > 0;
      const hasExpenses = Array.isArray(expenses) && expenses.length > 0;
      setCanAddDebts(hasIncome && hasExpenses);
    } catch {
      setCanAddDebts(false);
    } finally {
      setPrereqChecked(true);
    }
  }

  /* Add New Debt */
  async function addDebt() {
    await fetch("/api/debts", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        amount: Number(form.amount),
        interest: Number(form.interest),
        minimumPayment: form.paymentType === "recurring" ? Number(form.minimumPayment) : 0,
        totalMonths: form.paymentType === "recurring" ? Number(form.totalMonths || 0) : null,
        paymentType: form.paymentType,
      }),
    });

    setForm({
      name: "",
      amount: "",
      interest: "",
      minimumPayment: "",
      paymentType: "recurring",
      totalMonths: "",
    });
    await loadDebts();
    emitPlanChangeSignal();
  }

  /* Enter Edit Mode */
  function startEdit(d: DebtItem) {
    setEditingId(d._id);
    setEditForm({
      name: d.name,
      amount: d.amount,
      interest: d.interest,
      minimumPayment: d.minimumPayment,
      paymentType: d.paymentType ?? "recurring",
      totalMonths: d.totalMonths ?? "",
    });
  }

  /* Update Debt */
  async function updateDebt() {
    await fetch(`/api/debts/${editingId}`, {
      method: "PUT",
      body: JSON.stringify({
        ...editForm,
        amount: Number(editForm.amount),
        interest: Number(editForm.interest),
        minimumPayment: Number(editForm.minimumPayment),
        paymentType: editForm.paymentType,
        totalMonths: editForm.paymentType === "recurring" ? Number(editForm.totalMonths || 0) : null,
      }),
    });

    setEditingId(null);
    await loadDebts();
    emitPlanChangeSignal();
  }

  /* Delete Debt */
  async function deleteDebt(id: string) {
    await fetch(`/api/debts/${id}`, { method: "DELETE" });
    await loadDebts();
    emitPlanChangeSignal();
  }

  useEffect(() => {
    void (async () => {
      await Promise.all([loadDebts(), checkIncomeExpenses()]);
    })();
  }, []);

  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-5xl mx-auto text-gray-100 w-full">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">My Debts</h1>
          <p className="text-gray-400">Track, edit, and add your liabilities in one place.</p>
        </div>
      </div>

      {/* Add Form */}
      <div className="relative mb-6">
        {prereqChecked && !canAddDebts && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 rounded-2xl text-center px-4">
            <div className="text-sm text-gray-100 space-y-2">
              <p className="font-semibold text-lg">Add income and expenses first</p>
              <p className="text-gray-300">Please enter your income and expenses before adding debts.</p>
            </div>
          </div>
        )}
        <div
          className={`bg-[#11121a] border border-[#1f2235] rounded-2xl p-6 shadow-lg shadow-black/30 ${
            prereqChecked && !canAddDebts ? "blur-[2px] pointer-events-none select-none" : ""
          }`}
        >
          <h2 className="text-xl font-semibold text-white mb-4">Add a new debt</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Debt Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <FormField
              label="Amount"
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
            <FormField
              label="Interest Rate (%)"
              type="number"
              value={form.interest}
              onChange={(e) => setForm({ ...form, interest: e.target.value })}
            />
            <label className="flex flex-col gap-1 text-sm text-gray-300">
              <span className="font-medium">Payment Type</span>
              <select
                className="w-full rounded-lg border border-[#2a2d42] bg-[#0e101a] text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={form.paymentType}
                onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
              >
                <option value="recurring">Monthly recurring</option>
                <option value="one-time">One-time payoff</option>
              </select>
            </label>
            {form.paymentType === "recurring" && (
              <>
                <FormField
                  label="Minimum Payment"
                  type="number"
                  value={form.minimumPayment}
                  onChange={(e) => setForm({ ...form, minimumPayment: e.target.value })}
                />
                <FormField
                  label="Total Months EMI"
                  type="number"
                  value={form.totalMonths}
                  onChange={(e) => setForm({ ...form, totalMonths: e.target.value })}
                />
              </>
            )}
          </div>
          <button
            onClick={addDebt}
            disabled={!canAddDebts}
            className="mt-4 w-full md:w-auto bg-indigo-600 disabled:opacity-60 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-900/30"
          >
            Add Debt
          </button>
        </div>
      </div>

      {/* Debt List */}
      {debts.length === 0 && <p className="text-gray-700">No debts added yet.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {debts.map((d) => (
          <div key={d._id} className="bg-[#11121a] border border-[#1f2235] rounded-2xl p-5 shadow-lg shadow-black/30">
            {editingId === d._id ? (
              /* EDIT MODE */
              <div className="space-y-3">
                <FormField
                  label="Debt Name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
                <FormField
                  label="Amount"
                  type="number"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                />
                <FormField
                  label="Interest Rate (%)"
                  type="number"
                  value={editForm.interest}
                  onChange={(e) => setEditForm({ ...editForm, interest: e.target.value })}
                />
                {editForm.paymentType === "recurring" && (
                  <>
                    <FormField
                      label="Minimum Payment"
                      type="number"
                      value={editForm.minimumPayment}
                      onChange={(e) =>
                        setEditForm({ ...editForm, minimumPayment: e.target.value })
                      }
                    />
                    <FormField
                      label="Total Months EMI"
                      type="number"
                      value={editForm.totalMonths}
                      onChange={(e) => setEditForm({ ...editForm, totalMonths: e.target.value })}
                    />
                  </>
                )}
                <label className="flex flex-col gap-1 text-sm text-gray-300">
                  <span className="font-medium">Payment Type</span>
                  <select
                    className="w-full rounded-lg border border-[#2a2d42] bg-[#0e101a] text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={editForm.paymentType}
                    onChange={(e) =>
                      setEditForm({ ...editForm, paymentType: e.target.value })
                    }
                  >
                    <option value="recurring">Monthly recurring</option>
                    <option value="one-time">One-time payoff</option>
                  </select>
                </label>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={updateDebt}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition w-full"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition w-full"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* VIEW MODE */
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-xl text-white">{d.name}</h2>
                  <span className="text-sm text-white font-semibold">
                    {formatter.format(d.amount)}
                  </span>
                </div>
                <p className="text-gray-300">Interest: {d.interest}% APR</p>
                <p className="text-gray-300">
                  Minimum Payment: {formatter.format(d.minimumPayment)}
                </p>
                <p className="text-gray-300">
                  Payment Type: {d.paymentType === "one-time" ? "One-time payoff" : "Monthly recurring"}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => startEdit(d)}
                    className="bg-white/5 text-indigo-100 px-4 py-2 rounded-lg font-medium hover:bg-white/10 transition w-full"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteDebt(d._id)}
                    className="bg-red-500/10 text-red-200 px-4 py-2 rounded-lg font-medium hover:bg-red-500/20 transition w-full"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FormField({
  label,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  type?: string;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-gray-300">
      <span className="font-medium">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-[#2a2d42] bg-[#0e101a] text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
    </label>
  );
}
