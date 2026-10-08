import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import SaleForm from "@/components/sales/sale-form";

export default async function NewSalePage() {
  await requireRole(["ADMIN", "STAFF"]);

  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, sku, price, stock_quantity")
    .eq("is_active", true)
    .gt("stock_quantity", 0)
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link
          href="/dashboard/sales"
          className="text-sm text-green-600 hover:text-green-700"
        >
          ← Back to Sales
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-gray-900">
          New Sale
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Create a customer sale and update inventory.
        </p>
      </div>

      <SaleForm products={products || []} />
    </div>
  );
}