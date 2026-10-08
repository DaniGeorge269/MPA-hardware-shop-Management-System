import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import ProductForm from "@/components/products/product-form";

export default async function NewProductPage() {
  await requireRole(["ADMIN", "STAFF"]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/dashboard/products"
          className="text-sm text-green-600 hover:text-green-700"
        >
          ← Back to Products
        </Link>

        <h1 className="mt-3 text-2xl font-bold text-gray-900">
          Add Product
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Add a new hardware product to your inventory.
        </p>
      </div>

      <ProductForm />
    </div>
  );
}