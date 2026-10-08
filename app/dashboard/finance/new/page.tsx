import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import TransactionForm from "@/components/finance/transaction-form";

export default async function NewTransactionPage() {
  await requireRole(["ADMIN", "FINANCE"]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/dashboard/finance"
          className="text-sm text-green-600 hover:text-green-700"
        >
          ← Back to Finance
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-gray-900">
          Add Transaction
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Record income or an expense.
        </p>
      </div>

      <TransactionForm />
    </div>
  );
}