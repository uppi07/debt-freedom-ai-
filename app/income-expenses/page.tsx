"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { emitPlanChangeSignal } from "@/lib/hooks/usePlan";

type IncomeItem = { _id: string; source: string; amount: number };
type ExpenseItem = { _id: string; category: string; amount: number };

export default function IncomeExpenses() {
  const [incomeList, setIncomeList] = useState<IncomeItem[]>([]);
  const [expenseList, setExpenseList] = useState<ExpenseItem[]>([]);
  const [currency] = useState("INR");

  const [incomeForm, setIncomeForm] = useState({ source: "", amount: "" });
  const [expenseForm, setExpenseForm] = useState({ category: "", amount: "" });

  const [editingIncome, setEditingIncome] = useState<IncomeItem | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);

  // Load Data
  async function loadData() {
    const incomes = (await fetch("/api/income").then((r) => r.json())) as IncomeItem[];
    const expenses = (await fetch("/api/expenses").then((r) => r.json())) as ExpenseItem[];
    setIncomeList(incomes);
    setExpenseList(expenses);
  }

  // Add Income
  async function addIncome() {
    await fetch("/api/income", {
      method: "POST",
      body: JSON.stringify({
        source: incomeForm.source,
        amount: Number(incomeForm.amount),
      }),
    });

    setIncomeForm({ source: "", amount: "" });
    await loadData();
    emitPlanChangeSignal();
  }

  // Add Expense
  async function addExpense() {
    await fetch("/api/expenses", {
      method: "POST",
      body: JSON.stringify({
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
      }),
    });

    setExpenseForm({ category: "", amount: "" });
    await loadData();
    emitPlanChangeSignal();
  }

  // Update Income
  async function updateIncome() {
    await fetch(`/api/income/${editingIncome._id}`, {
      method: "PUT",
      body: JSON.stringify({
        source: editingIncome.source,
        amount: Number(editingIncome.amount),
      }),
    });

    setEditingIncome(null);
    await loadData();
    emitPlanChangeSignal();
  }

  // Update Expense
  async function updateExpense() {
    await fetch(`/api/expenses/${editingExpense._id}`, {
      method: "PUT",
      body: JSON.stringify({
        category: editingExpense.category,
        amount: Number(editingExpense.amount),
      }),
    });

    setEditingExpense(null);
    await loadData();
    emitPlanChangeSignal();
  }

  // Delete Income
  async function deleteIncome(id: string) {
    await fetch(`/api/income/${id}`, { method: "DELETE" });
    await loadData();
    emitPlanChangeSignal();
  }

  // Delete Expense
  async function deleteExpense(id: string) {
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    await loadData();
    emitPlanChangeSignal();
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
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
          <h1 className="text-3xl font-bold text-white">
            Income & Expenses
          </h1>
          <p className="text-gray-400">
            Add recurring income and expenses to keep your surplus accurate.
          </p>
        </div>
      </div>

      {/* Add Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <section className="bg-[#11121a] border border-[#1f2235] rounded-2xl p-5 shadow-lg shadow-black/30">
          <h2 className="text-xl mb-3 font-semibold text-white">
            Add Income
          </h2>
          <FormField
            label="Income Source"
            value={incomeForm.source}
            onChange={(e) => setIncomeForm({ ...incomeForm, source: e.target.value })}
          />
          <FormField
            label="Amount"
            type="number"
            value={incomeForm.amount}
            onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
          />
          <button
            onClick={addIncome}
            className="mt-3 w-full bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition shadow-lg shadow-emerald-900/30"
          >
            Add Income
          </button>
        </section>

        <section className="bg-[#11121a] border border-[#1f2235] rounded-2xl p-5 shadow-lg shadow-black/30">
          <h2 className="text-xl mb-3 font-semibold text-white">
            Add Expense
          </h2>
          <FormField
            label="Category"
            value={expenseForm.category}
            onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
          />
          <FormField
            label="Amount"
            type="number"
            value={expenseForm.amount}
            onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
          />
          <button
            onClick={addExpense}
            className="mt-3 w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-900/30"
          >
            Add Expense
          </button>
        </section>
      </div>

      {/* Lists */}
      <section className="space-y-6">
        {/* Income List */}
        <div>
          <h2 className="text-xl mb-3 font-semibold text-white">
            Income List
          </h2>
          {incomeList.length === 0 && <p className="text-gray-400">No income added yet.</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incomeList.map((i) => (
              <div
                key={i._id}
                className="bg-[#11121a] border border-[#1f2235] rounded-2xl p-4 shadow-lg shadow-black/30 flex justify-between items-start"
              >
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Source</p>
                  <p className="text-lg font-semibold text-white">{i.source}</p>
                  <p className="text-gray-300">{formatter.format(i.amount)}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    className="text-indigo-200 hover:underline font-medium"
                    onClick={() => setEditingIncome(i)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-300 hover:underline font-medium"
                    onClick={() => deleteIncome(i._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expense List */}
        <div>
          <h2 className="text-xl mb-3 font-semibold text-white">
            Expense List
          </h2>
          {expenseList.length === 0 && <p className="text-gray-400">No expenses added yet.</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {expenseList.map((e) => (
              <div
                key={e._id}
                className="bg-[#11121a] border border-[#1f2235] rounded-2xl p-4 shadow-lg shadow-black/30 flex justify-between items-start"
              >
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="text-lg font-semibold text-white">{e.category}</p>
                  <p className="text-gray-300">{formatter.format(e.amount)}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    className="text-indigo-200 hover:underline font-medium"
                    onClick={() => setEditingExpense(e)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-300 hover:underline font-medium"
                    onClick={() => deleteExpense(e._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Edit Income Modal */}
      {editingIncome && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 p-6 rounded-xl w-full max-w-md shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Income</h2>

            <FormField
              label="Income Source"
              value={editingIncome.source}
              onChange={(e) =>
                setEditingIncome({ ...editingIncome, source: e.target.value })
              }
            />

            <FormField
              label="Amount"
              type="number"
              value={editingIncome.amount}
              onChange={(e) =>
                setEditingIncome({
                  ...editingIncome,
                  amount: e.target.value,
                })
              }
            />

            <button
              onClick={updateIncome}
              className="bg-indigo-600 px-4 py-2 rounded w-full mb-2 text-white hover:bg-indigo-700 transition"
            >
              Save
            </button>

            <button
              onClick={() => setEditingIncome(null)}
              className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded w-full text-gray-900 dark:text-gray-50 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 p-6 rounded-xl w-full max-w-md shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Expense</h2>

            <FormField
              label="Category"
              value={editingExpense.category}
              onChange={(e) =>
                setEditingExpense({
                  ...editingExpense,
                  category: e.target.value,
                })
              }
            />

            <FormField
              label="Amount"
              type="number"
              value={editingExpense.amount}
              onChange={(e) =>
                setEditingExpense({
                  ...editingExpense,
                  amount: e.target.value,
                })
              }
            />

            <button
              onClick={updateExpense}
              className="bg-indigo-600 px-4 py-2 rounded w-full mb-2 text-white hover:bg-indigo-700 transition"
            >
              Save
            </button>

            <button
              onClick={() => setEditingExpense(null)}
              className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded w-full text-gray-900 dark:text-gray-50 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
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
    <label className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300 mb-3 last:mb-0">
      <span className="font-medium">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
    </label>
  );
}
