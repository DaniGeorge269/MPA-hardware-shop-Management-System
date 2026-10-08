import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PurchaseDetailPage({
  params,
}: PageProps) {
  await requireRole(["ADMIN", "FINANCE"]);

  const { id } = await params;

  const supabase = await createClient();

  const { data: purchase, error: purchaseError } =
    await supabase
      .from("purchases")
      .select("*")
      .eq("id", id)
      .single();

  if (purchaseError || !purchase) {
    notFound();
  }

  const { data: items, error: itemsError } =
    await supabase
      .from("purchase_items")
      .select(
        `
        id,
        quantity,
        unit_cost,
        total_cost,
        product_id,
        products (
          name,
          sku
        )
      `
      )
      .eq("purchase_id", id);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/purchases"
          className="text-sm text-green-600 hover:text-green-700"
        >
          ← Back to Purchases
        </Link>

        <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Purchase Details
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Purchase #{purchase.id.slice(0, 8)}
            </p>
          </div>

          <span
            className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-medium ${
              purchase.payment_status === "PAID"
                ? "bg-green-50 text-green-600"
                : purchase.payment_status === "PARTIAL"
                  ? "bg-orange-50 text-orange-600"
                  : "bg-red-50 text-red-600"
            }`}
          >
            {purchase.payment_status === "PAID"
              ? "Paid"
              : purchase.payment_status === "PARTIAL"
                ? "Partial"
                : "Unpaid"}
          </span>
        </div>
      </div>

      {/* Supplier Information */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Supplier Information
        </h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Supplier
            </p>

            <p className="mt-1 font-medium text-gray-900">
              {purchase.supplier_name}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Phone
            </p>

            <p className="mt-1 text-gray-700">
              {purchase.supplier_phone || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Purchase Date
            </p>

            <p className="mt-1 text-gray-700">
              {purchase.purchase_date}
            </p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="font-semibold text-gray-900">
            Purchased Products
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {items?.length || 0} product
            {(items?.length || 0) !== 1 ? "s" : ""}
          </p>
        </div>

        {items && items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-5 py-3 font-medium text-gray-600">
                    Product
                  </th>

                  <th className="px-5 py-3 font-medium text-gray-600">
                    SKU
                  </th>

                  <th className="px-5 py-3 text-right font-medium text-gray-600">
                    Quantity
                  </th>

                  <th className="px-5 py-3 text-right font-medium text-gray-600">
                    Unit Cost
                  </th>

                  <th className="px-5 py-3 text-right font-medium text-gray-600">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => {
                  const product = Array.isArray(
                    item.products
                  )
                    ? item.products[0]
                    : item.products;

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="px-5 py-4 font-medium text-gray-900">
                        {product?.name || "Unknown Product"}
                      </td>

                      <td className="px-5 py-4 text-gray-500">
                        {product?.sku || "—"}
                      </td>

                      <td className="px-5 py-4 text-right text-gray-700">
                        {item.quantity}
                      </td>

                      <td className="px-5 py-4 text-right text-gray-700">
                        ${Number(item.unit_cost).toFixed(2)}
                      </td>

                      <td className="px-5 py-4 text-right font-semibold text-gray-900">
                        ${Number(item.total_cost).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            No products found for this purchase.
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900">
            Payment Information
          </h2>

          <div className="mt-5 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Payment Status
              </span>

              <span className="font-medium text-gray-900">
                {purchase.payment_status}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Payment Method
              </span>

              <span className="font-medium text-gray-900">
                {purchase.payment_method || "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900">
            Purchase Summary
          </h2>

          <div className="mt-5 space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>
                ${Number(purchase.subtotal).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between text-sm text-gray-600">
              <span>Discount</span>
              <span>
                -${Number(purchase.discount).toFixed(2)}
              </span>
            </div>

            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">
                  Total
                </span>

                <span className="text-xl font-bold text-gray-900">
                  ${Number(purchase.total_amount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {purchase.notes && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900">
            Notes
          </h2>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            {purchase.notes}
          </p>
        </div>
      )}
    </div>
  );
}