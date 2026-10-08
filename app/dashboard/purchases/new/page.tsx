import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import PurchaseForm from "@/components/purchases/purchase-form";

export default async function NewPurchasePage() {
  await requireRole(["ADMIN", "FINANCE"]);

  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select(
      "id, name, sku, cost_price, stock_quantity"
    )
    .eq("is_active", true)
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <Link
          href="/dashboard/purchases"
          className="text-sm text-green-600 hover:text-green-700"
        >
          ← Back to Purchases
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-gray-900">
          New Purchase
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Record a supplier purchase and add the items to inventory.
        </p>
      </div>

      <PurchaseForm products={products || []} />
    </div>
  );
}