import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export default async function PurchasesPage() {
  await requireRole(["ADMIN", "FINANCE"]);

  const supabase = await createClient();

  const { data: purchases, error } = await supabase
    .from("purchases")
    .select("*")
    .order("purchase_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const totalPurchases =
    purchases?.reduce(
      (total, purchase) =>
        total + Number(purchase.total_amount),
      0
    ) || 0;

  const paidPurchases =
    purchases
      ?.filter(
        (purchase) => purchase.payment_status === "PAID"
      )
      .reduce(
        (total, purchase) =>
          total + Number(purchase.total_amount),
        0
      ) || 0;

  const unpaidPurchases =
    purchases
      ?.filter(
        (purchase) => purchase.payment_status === "UNPAID"
      )
      .reduce(
        (total, purchase) =>
          total + Number(purchase.total_amount),
        0
      ) || 0;

  return (
    <div>
      {/* Header */}
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Purchases
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage supplier purchases and stock replenishment.
        </p>
      </div>

      <Link
        href="/dashboard/purchases/new"
        className="rounded-lg bg-green-600 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-green-700"
      >
        New Purchase
      </Link>
    </div>


      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            Total Purchases
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            ${totalPurchases.toFixed(2)}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            Paid
          </p>

          <p className="mt-2 text-2xl font-bold text-green-600">
            ${paidPurchases.toFixed(2)}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-medium text-gray-500">
            Unpaid
          </p>

          <p className="mt-2 text-2xl font-bold text-red-600">
            ${unpaidPurchases.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {purchases && purchases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-5 py-3 font-medium text-gray-600">
                    Date
                  </th>

                  <th className="px-5 py-3 font-medium text-gray-600">
                    Supplier
                  </th>

                  <th className="px-5 py-3 font-medium text-gray-600">
                    Phone
                  </th>

                  <th className="px-5 py-3 font-medium text-gray-600">
                    Payment
                  </th>

                  <th className="px-5 py-3 text-right font-medium text-gray-600">
                    Total
                  </th>

                  <th className="px-5 py-3 text-right font-medium text-gray-600">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {purchases.map((purchase) => (
                  <tr
                    key={purchase.id}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="px-5 py-4 text-gray-500">
                      {purchase.purchase_date}
                    </td>

                    <td className="px-5 py-4 font-medium text-gray-900">
                      {purchase.supplier_name}
                    </td>

                    <td className="px-5 py-4 text-gray-500">
                      {purchase.supplier_phone || "—"}
                    </td>

                    <td className="px-5 py-4">
                      {purchase.payment_status === "PAID" && (
                        <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-600">
                          Paid
                        </span>
                      )}

                      {purchase.payment_status === "PARTIAL" && (
                        <span className="inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-600">
                          Partial
                        </span>
                      )}

                      {purchase.payment_status === "UNPAID" && (
                        <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                          Unpaid
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-gray-900">
                      $
                      {Number(
                        purchase.total_amount
                      ).toFixed(2)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/dashboard/purchases/${purchase.id}`}
                        className="text-sm font-medium text-green-600 hover:text-green-700"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              No purchases yet
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Create your first purchase to add stock.
            </p>

            <Link
              href="/dashboard/purchases/new"
              className="mt-5 inline-flex rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
            >
              New Purchase
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}