import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export default async function ProductsPage() {
  await requireRole(["ADMIN", "STAFF"]);

  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your hardware products.
          </p>
        </div>

        <Link
          href="/dashboard/products/new"
          className="rounded-lg bg-green-600 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-green-700"
        >
          Add Product
        </Link>
      </div>

      {/* Products */}
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {products && products.length > 0 ? (
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
                  <th className="px-5 py-3 font-medium text-gray-600">
                    Category
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-600">
                    Price
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-600">
                    Stock
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-600">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right font-medium text-gray-600">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => {
                  const lowStock =
                    product.stock_quantity <= product.low_stock_threshold;

                  return (
                    <tr
                      key={product.id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      {/* Product */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                            {product.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-xs text-gray-400">
                                No image
                                </div>
                            )}
                            </div>

                          <div>
                            <p className="font-medium text-gray-900">
                              {product.name}
                            </p>

                            {product.brand && (
                              <p className="text-xs text-gray-400">
                                {product.brand}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-5 py-4 text-gray-500">
                        {product.sku}
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4 text-gray-500">
                        {product.category || "—"}
                      </td>

                      {/* Price */}
                      <td className="px-5 py-4 font-medium text-gray-900">
                        ${Number(product.price).toFixed(2)}
                      </td>

                      {/* Stock */}
                      <td className="px-5 py-4 text-gray-900">
                        {product.stock_quantity}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {lowStock ? (
                          <span className="inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-600">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-600">
                            In Stock
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/dashboard/products/${product.id}/edit`}
                          className="text-sm font-medium text-green-600 hover:text-green-700"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              No products yet
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Add your first hardware product to get started.
            </p>

            <Link
              href="/dashboard/products/new"
              className="mt-5 inline-flex rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
            >
              Add Product
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}