"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type TransactionType = "INCOME" | "EXPENSE";

export default function TransactionForm() {
  const router = useRouter();
  const supabase = createClient();

  const [type, setType] = useState<TransactionType>("INCOME");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [reference, setReference] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in.");
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("finance_transactions")
        .insert({
          type,
          category,
          description: description || null,
          amount: Number(amount),
          payment_method: paymentMethod || null,
          reference: reference || null,
          transaction_date: transactionDate,
          recorded_by: user.id,
        });

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      router.push("/dashboard/finance");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border border-gray-200 bg-white p-6"
    >
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Type */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Transaction Type
        </label>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setType("INCOME")}
            className={`rounded-lg border px-4 py-3 text-sm font-medium ${
              type === "INCOME"
                ? "border-green-600 bg-green-50 text-green-700"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Income
          </button>

          <button
            type="button"
            onClick={() => setType("EXPENSE")}
            className={`rounded-lg border px-4 py-3 text-sm font-medium ${
              type === "EXPENSE"
                ? "border-red-600 bg-red-50 text-red-700"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Expense
          </button>
        </div>
      </div>

      {/* Category + Amount */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Category
          </label>

          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder={
              type === "INCOME"
                ? "Sales"
                : "Transport"
            }
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Amount
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* Payment Method */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Payment Method
          </label>

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          >
            <option value="">Select method</option>
            <option value="CASH">Cash</option>
            <option value="BANK">Bank Transfer</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="CARD">Card</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Transaction Date
          </label>

          <input
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* Reference */}
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Reference
          </label>

          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Invoice number, receipt number, etc."
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Description
          </label>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Add transaction details..."
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
        <button
          type="button"
          onClick={() => router.push("/dashboard/finance")}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className={`rounded-lg px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${
            type === "INCOME"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {loading
            ? "Saving..."
            : `Add ${type === "INCOME" ? "Income" : "Expense"}`}
        </button>
      </div>
    </form>
  );
}