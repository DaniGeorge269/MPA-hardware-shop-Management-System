import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import ProductEditForm from "@/components/products/product-edit-form";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditProductPage({ params }: PageProps) {
  await requireRole(["ADMIN", "STAFF"]);

  const { id } = await params;

  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !product) {
    notFound();
  }

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
          Edit Product
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Update product information and inventory details.
        </p>
      </div>

      <ProductEditForm product={product} />
    </div>
  );
}