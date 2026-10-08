import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Transaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  description: string | null;
  amount: number;
  payment_method?: string | null;
  transaction_date: string;
  created_at: string;
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export default async function FinancePage() {
  await requireRole(["ADMIN", "FINANCE"]);

  const supabase = await createClient();

  const { data: rawTransactions, error } = await supabase
    .from("finance_transactions")
    .select("*")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const transactions = (rawTransactions || []) as Transaction[];

  const income = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const expenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const balance = income - expenses;
  const savingsRate = income > 0 ? Math.max(0, ((balance / income) * 100)) : 0;

  return (
    <div className="min-h-screen space-y-8 bg-purple-50/30 p-6 md:p-8">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-0.5 text-xs font-semibold text-purple-700">
            Treasury & Ledger
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
            Financial Ledger
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Audit cash inflows, categorized expenditures, and balance reconciliations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/finance/new"
            className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-purple-600/30 transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            + Add Transaction
          </Link>
        </div>
      </div>

      {/* SUMMARY STAT CARDS */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Income */}
        <div className="relative overflow-hidden rounded-2xl border border-purple-100 bg-white p-6 shadow-sm shadow-purple-100/50 transition hover:shadow-md hover:border-purple-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
                Total Inflow
              </p>
              <p className="mt-2 text-3xl font-black tracking-tight text-gray-950">
                {formatCurrency(income)}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                From {transactions.filter((t) => t.type === "INCOME").length} revenue entries
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-100 bg-purple-50 font-bold text-purple-700">
              ↗
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="relative overflow-hidden rounded-2xl border border-purple-100 bg-white p-6 shadow-sm shadow-purple-100/50 transition hover:shadow-md hover:border-purple-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
                Total Outflow
              </p>
              <p className="mt-2 text-3xl font-black tracking-tight text-gray-950">
                {formatCurrency(expenses)}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                From {transactions.filter((t) => t.type === "EXPENSE").length} expense records
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-100 bg-purple-50 font-bold text-purple-700">
              ↘
            </div>
          </div>
        </div>

        {/* Net Balance */}
        <div className="relative overflow-hidden rounded-2xl border border-purple-100 bg-white p-6 shadow-sm shadow-purple-100/50 transition hover:shadow-md hover:border-purple-200 sm:col-span-2 lg:col-span-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
                Net Position
              </p>
              <p
                className={`mt-2 text-3xl font-black tracking-tight ${
                  balance >= 0 ? "text-purple-950" : "text-rose-600"
                }`}
              >
                {formatCurrency(balance)}
              </p>
              <p className="mt-1 text-xs text-purple-600 font-medium">
                {balance >= 0
                  ? `${savingsRate.toFixed(1)}% net retention`
                  : "Deficit relative to gross"}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-100 bg-purple-50 font-bold text-purple-700">
              ◈
            </div>
          </div>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50">
        <div className="flex items-center justify-between border-b border-purple-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Ledger Transactions
            </h2>
            <p className="text-xs text-gray-500">
              Complete chronological journal
            </p>
          </div>
          <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 border border-purple-100">
            {transactions.length} records
          </span>
        </div>

        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-purple-100 bg-purple-50/50">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-purple-900">
                    Date
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-purple-900">
                    Type
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-purple-900">
                    Category
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-purple-900">
                    Description
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-purple-900">
                    Channel
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-purple-900">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-purple-50">
                {transactions.map((tx) => {
                  const isIncome = tx.type === "INCOME";

                  return (
                    <tr
                      key={tx.id}
                      className="transition hover:bg-purple-50/40"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-xs font-medium text-gray-600">
                        {formatDate(tx.transaction_date)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                            isIncome
                              ? "border-purple-200 bg-purple-100 text-purple-700"
                              : "border-slate-200 bg-slate-100 text-slate-700"
                          }`}
                        >
                          {isIncome ? "Income" : "Expense"}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-medium text-gray-900">
                        {tx.category}
                      </td>

                      <td className="max-w-xs truncate px-6 py-4 text-xs text-gray-500">
                        {tx.description || "—"}
                      </td>

                      <td className="px-6 py-4 text-xs text-gray-500">
                        {tx.payment_method ? (
                          <span className="rounded-md border border-purple-100 bg-purple-50/50 px-2 py-0.5 text-purple-900 font-medium">
                            {tx.payment_method}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td
                        className={`whitespace-nowrap px-6 py-4 text-right font-bold ${
                          isIncome ? "text-purple-900" : "text-gray-900"
                        }`}
                      >
                        {isIncome ? "+" : "−"} {formatCurrency(Number(tx.amount))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600 text-xl font-bold mb-3">
              $
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              No transactions recorded
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              All logged cash inflows and operational expenses will display here.
            </p>
            <div className="mt-5">
              <Link
                href="/dashboard/finance/new"
                className="inline-flex items-center rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700"
              >
                + Add your first transaction
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}