import Image from "next/image";
import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Product = {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  category: string | null;
  brand: string | null;
  price: number;
  cost_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);

export default async function InventoryPage() {
  await requireRole(["ADMIN", "STAFF"]);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      `
        id,
        name,
        sku,
        description,
        category,
        brand,
        price,
        cost_price,
        stock_quantity,
        low_stock_threshold,
        image_url,
        is_active,
        created_at
      `
    )
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const products = (data || []) as Product[];

  /* =========================
      INVENTORY CALCULATIONS
  ========================= */
  const totalProducts = products.length;

  const totalUnits = products.reduce(
    (sum, product) => sum + Number(product.stock_quantity || 0),
    0
  );

  const inventoryCostValue = products.reduce(
    (sum, product) =>
      sum +
      Number(product.stock_quantity || 0) * Number(product.cost_price || 0),
    0
  );

  const inventoryRetailValue = products.reduce(
    (sum, product) =>
      sum + Number(product.stock_quantity || 0) * Number(product.price || 0),
    0
  );

  const potentialProfit = inventoryRetailValue - inventoryCostValue;

  const lowStockProducts = products.filter(
    (product) =>
      Number(product.stock_quantity) > 0 &&
      Number(product.stock_quantity) <= Number(product.low_stock_threshold)
  );

  const outOfStockProducts = products.filter(
    (product) => Number(product.stock_quantity) === 0
  );

  const healthyProducts = products.filter(
    (product) =>
      Number(product.stock_quantity) > Number(product.low_stock_threshold)
  );

  const categories = Array.from(
    new Set(
      products
        .map((product) => product.category)
        .filter((cat): cat is string => Boolean(cat))
    )
  ).sort();

  /* =========================
      STOCK RATIOS
  ========================= */
  const healthyPercentage =
    totalProducts > 0 ? (healthyProducts.length / totalProducts) * 100 : 0;
  const lowStockPercentage =
    totalProducts > 0 ? (lowStockProducts.length / totalProducts) * 100 : 0;
  const outOfStockPercentage =
    totalProducts > 0 ? (outOfStockProducts.length / totalProducts) * 100 : 0;

  return (
    <div className="min-h-screen space-y-8 bg-purple-50/30 p-6 md:p-8">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-0.5 text-xs font-semibold text-purple-700">
            Stock Management
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
            Inventory Central
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Live catalog valuation, reorder thresholds, and active SKU inventory.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/products"
            className="inline-flex items-center justify-center rounded-xl border border-purple-200 bg-white px-4 py-2.5 text-sm font-semibold text-purple-900 shadow-sm transition hover:bg-purple-50 hover:border-purple-300"
          >
            Catalog Directory
          </Link>
          <Link
            href="/dashboard/purchases/new"
            className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-purple-600/30 transition hover:bg-purple-700"
          >
            + Receive Stock
          </Link>
        </div>
      </div>

      {/* SUMMARY KPI CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <SummaryCard
          title="Active SKUs"
          value={totalProducts.toString()}
          description="Catalog items"
        />
        <SummaryCard
          title="Units In Stock"
          value={totalUnits.toLocaleString()}
          description="Aggregate inventory"
        />
        <SummaryCard
          title="Cost Valuation"
          value={formatCurrency(inventoryCostValue)}
          description="Total asset baseline"
        />
        <SummaryCard
          title="Retail Potential"
          value={formatCurrency(inventoryRetailValue)}
          description="Full sell-through"
        />
        <SummaryCard
          title="Gross Margin"
          value={formatCurrency(potentialProfit)}
          description="Expected spread"
        />
        <SummaryCard
          title="Low / Out"
          value={`${lowStockProducts.length} / ${outOfStockProducts.length}`}
          description="Threshold warnings"
          danger={lowStockProducts.length > 0 || outOfStockProducts.length > 0}
        />
      </div>

      {/* STOCK HEALTH GAUGES */}
      <div className="grid gap-6 lg:grid-cols-3">
        <StockHealthCard
          title="Optimal Stock"
          count={healthyProducts.length}
          percentage={healthyPercentage}
          barColor="bg-purple-600"
          badgeColor="text-purple-700 bg-purple-50 border-purple-200"
        />
        <StockHealthCard
          title="Low Stock"
          count={lowStockProducts.length}
          percentage={lowStockPercentage}
          barColor="bg-amber-400"
          badgeColor="text-amber-700 bg-amber-50 border-amber-200"
        />
        <StockHealthCard
          title="Depleted / Out"
          count={outOfStockProducts.length}
          percentage={outOfStockPercentage}
          barColor="bg-rose-500"
          badgeColor="text-rose-700 bg-rose-50 border-rose-200"
        />
      </div>

      {/* STOCK ALERTS BANNER */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="rounded-2xl border border-purple-200 bg-white shadow-sm shadow-purple-100/50">
          <div className="flex items-center justify-between border-b border-purple-100 px-6 py-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
                <h2 className="text-base font-bold text-gray-900">
                  Critical Stock Alerts
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-gray-500">
                Products needing immediate supplier reorders
              </p>
            </div>
            <Link
              href="/dashboard/purchases/new"
              className="rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition hover:bg-purple-100"
            >
              Order restock →
            </Link>
          </div>

          <div className="divide-y divide-purple-50">
            {[...outOfStockProducts, ...lowStockProducts]
              .slice(0, 8)
              .map((product) => {
                const isOutOfStock = product.stock_quantity === 0;

                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-4 px-6 py-3.5 transition hover:bg-purple-50/30"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          width={44}
                          height={44}
                          className="h-11 w-11 rounded-xl border border-purple-100 object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-100 bg-purple-50 text-base text-purple-600">
                          📦
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-400">SKU: {product.sku}</p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-4">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          isOutOfStock
                            ? "border-rose-200 bg-rose-50 text-rose-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        {isOutOfStock
                          ? "Out of stock"
                          : `${product.stock_quantity} remaining`}
                      </span>

                      <Link
                        href={`/dashboard/products/${product.id}`}
                        className="text-xs font-semibold text-purple-600 hover:text-purple-800"
                      >
                        Details →
                      </Link>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* MASTER INVENTORY TABLE */}
      <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50">
        <div className="border-b border-purple-100 px-6 py-5">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Stock Inventory Master
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Filter and manage pricing, threshold triggers, and counts.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter product or SKU..."
                  className="w-full rounded-xl border border-purple-200 bg-purple-50/20 px-3.5 py-2 text-xs text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-purple-500 focus:bg-white focus:ring-2 focus:ring-purple-200 sm:w-60"
                  disabled
                />
              </div>

              <select
                disabled
                className="rounded-xl border border-purple-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 outline-none"
                defaultValue=""
              >
                <option value="">All Categories ({categories.length})</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {products.length > 0 ? (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-purple-100 bg-purple-50/50">
                  <tr>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-purple-900">
                      Product
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-purple-900">
                      Category
                    </th>
                    <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-purple-900">
                      Stock Level
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-purple-900">
                      Unit Cost
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-purple-900">
                      Selling Price
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-purple-900">
                      Asset Value
                    </th>
                    <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-purple-900">
                      Status
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-purple-900">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-purple-50">
                  {products.map((product) => {
                    const stock = Number(product.stock_quantity || 0);
                    const threshold = Number(product.low_stock_threshold || 0);
                    const stockValue = stock * Number(product.cost_price || 0);

                    const status =
                      stock === 0 ? "OUT" : stock <= threshold ? "LOW" : "HEALTHY";

                    return (
                      <tr
                        key={product.id}
                        className="transition hover:bg-purple-50/40"
                      >
                        {/* PRODUCT */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                width={44}
                                height={44}
                                className="h-10 w-10 rounded-xl border border-purple-100 object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-100 bg-purple-50 text-sm text-purple-600">
                                📦
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-900">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                SKU: {product.sku}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* CATEGORY */}
                        <td className="px-6 py-4 text-xs font-medium text-gray-600">
                          {product.category || "—"}
                        </td>

                        {/* STOCK */}
                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-gray-900">{stock}</span>
                          <span className="ml-1 text-xs text-gray-400">
                            / {threshold} min
                          </span>
                        </td>

                        {/* COST */}
                        <td className="px-6 py-4 text-right text-xs text-gray-600">
                          {formatCurrency(Number(product.cost_price))}
                        </td>

                        {/* SELLING PRICE */}
                        <td className="px-6 py-4 text-right text-xs font-semibold text-gray-900">
                          {formatCurrency(Number(product.price))}
                        </td>

                        {/* STOCK VALUE */}
                        <td className="px-6 py-4 text-right font-bold text-purple-950">
                          {formatCurrency(stockValue)}
                        </td>

                        {/* STATUS */}
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={status} />
                        </td>

                        {/* ACTION */}
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/dashboard/products/${product.id}`}
                            className="text-xs font-semibold text-purple-600 hover:text-purple-800"
                          >
                            Edit →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE LIST */}
            <div className="divide-y divide-purple-50 md:hidden">
              {products.map((product) => {
                const stock = Number(product.stock_quantity || 0);
                const threshold = Number(product.low_stock_threshold || 0);
                const stockValue = stock * Number(product.cost_price || 0);

                const status =
                  stock === 0 ? "OUT" : stock <= threshold ? "LOW" : "HEALTHY";

                return (
                  <div key={product.id} className="p-4 transition hover:bg-purple-50/20">
                    <div className="flex gap-3">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          width={52}
                          height={52}
                          className="h-13 w-13 shrink-0 rounded-xl border border-purple-100 object-cover"
                        />
                      ) : (
                        <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-xl border border-purple-100 bg-purple-50 text-base text-purple-600">
                          📦
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-400">SKU: {product.sku}</p>
                          </div>
                          <StatusBadge status={status} />
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-purple-50 bg-purple-50/40 p-2.5 text-xs">
                          <div>
                            <span className="text-gray-400">Stock:</span>{" "}
                            <span className="font-bold text-gray-900">{stock}</span>{" "}
                            <span className="text-[10px] text-gray-400">
                              (min {threshold})
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Retail:</span>{" "}
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(Number(product.price))}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Unit Cost:</span>{" "}
                            <span className="text-gray-700">
                              {formatCurrency(Number(product.cost_price))}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Total Value:</span>{" "}
                            <span className="font-bold text-purple-950">
                              {formatCurrency(stockValue)}
                            </span>
                          </div>
                        </div>

                        <Link
                          href={`/dashboard/products/${product.id}`}
                          className="mt-3 inline-block text-xs font-semibold text-purple-600 hover:text-purple-800"
                        >
                          View item details →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-xl font-bold mb-3">
              📦
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              No inventory records
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Add products to your catalog to track stock units and valuation.
            </p>
            <div className="mt-5">
              <Link
                href="/dashboard/products/new"
                className="inline-flex items-center rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700"
              >
                + Register Product
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* DETAILED CAPITAL BREAKDOWN */}
      <div className="grid gap-6 md:grid-cols-3">
        <ValueCard
          title="Stock Procurement Cost"
          value={inventoryCostValue}
          description="Capital sunk into existing product units."
        />
        <ValueCard
          title="Projected Gross Revenue"
          value={inventoryRetailValue}
          description="Estimated returns upon full stock liquidation."
        />
        <ValueCard
          title="Potential Realizable Profit"
          value={potentialProfit}
          description="Projected spread across all shelf units."
          highlight
        />
      </div>

      {/* QUICK INVENTORY ACTIONS */}
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-purple-900">
          Stock Operations
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            href="/dashboard/products/new"
            title="Create SKU"
            description="Add brand-new catalog item"
          />
          <QuickAction
            href="/dashboard/purchases/new"
            title="Stock Receipt"
            description="Log inbound supplier consignment"
          />
          <QuickAction
            href="/dashboard/products"
            title="Update Catalog"
            description="Edit item threshold & specs"
          />
          <QuickAction
            href="/dashboard/sales/new"
            title="Sell Product"
            description="Fulfill order from inventory"
          />
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
    UI COMPONENTS (PURPLE & WHITE SYSTEM)
========================================================================= */

function SummaryCard({
  title,
  value,
  description,
  danger = false,
}: {
  title: string;
  value: string;
  description: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${
        danger
          ? "border-rose-200 bg-rose-50/40"
          : "border-purple-100 bg-white shadow-purple-100/40"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
        {title}
      </p>
      <p
        className={`mt-2 text-2xl font-black tracking-tight ${
          danger ? "text-rose-600" : "text-gray-950"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-[11px] text-gray-400">{description}</p>
    </div>
  );
}

function StockHealthCard({
  title,
  count,
  percentage,
  barColor,
  badgeColor,
}: {
  title: string;
  count: number;
  percentage: number;
  barColor: string;
  badgeColor: string;
}) {
  return (
    <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm shadow-purple-100/40">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500">{title}</p>
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-bold ${badgeColor}`}
        >
          {count} SKUs
        </span>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-purple-50">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <p className="mt-2 text-xs font-medium text-gray-400">
        {percentage.toFixed(1)}% of product catalog
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: "HEALTHY" | "LOW" | "OUT" }) {
  if (status === "OUT") {
    return (
      <span className="whitespace-nowrap rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
        Depleted
      </span>
    );
  }

  if (status === "LOW") {
    return (
      <span className="whitespace-nowrap rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
        Low Stock
      </span>
    );
  }

  return (
    <span className="whitespace-nowrap rounded-full border border-purple-200 bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-700">
      Healthy
    </span>
  );
}

function ValueCard({
  title,
  value,
  description,
  highlight = false,
}: {
  title: string;
  value: number;
  description: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 shadow-sm transition hover:shadow-md ${
        highlight
          ? "border-purple-300 bg-purple-50/50 shadow-purple-100/60"
          : "border-purple-100 bg-white shadow-purple-100/40"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
        {title}
      </p>
      <p
        className={`mt-2 text-2xl font-black tracking-tight ${
          highlight ? "text-purple-950" : "text-gray-900"
        }`}
      >
        {formatCurrency(value)}
      </p>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </div>
  );
}

function QuickAction({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-purple-100 bg-white p-4 shadow-sm shadow-purple-100/40 transition hover:border-purple-300 hover:bg-purple-50/40"
    >
      <p className="font-semibold text-gray-900 group-hover:text-purple-700 transition">
        {title}
      </p>
      <p className="mt-0.5 text-xs text-gray-400">{description}</p>
    </Link>
  );
}