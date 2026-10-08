import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Sale = {
  id: string;
  customer_name: string | null;
  total_amount: number;
  payment_status: "PAID" | "PARTIAL" | "UNPAID";
  sale_date: string;
  created_at: string;
};

type Purchase = {
  id: string;
  supplier_name: string;
  total_amount: number;
  payment_status: "PAID" | "PARTIAL" | "UNPAID";
  purchase_date: string;
  created_at: string;
};

type FinanceTransaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  description: string | null;
  amount: number;
  transaction_date: string;
  created_at: string;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);

export default async function DashboardPage() {
  await requireRole(["ADMIN", "STAFF", "FINANCE"]);

  const supabase = await createClient();

  const [salesResult, purchasesResult, financeResult, productsResult] =
    await Promise.all([
      supabase
        .from("sales")
        .select("id, customer_name, total_amount, payment_status, sale_date, created_at")
        .order("created_at", { ascending: false }),

      supabase
        .from("purchases")
        .select("id, supplier_name, total_amount, payment_status, purchase_date, created_at")
        .order("created_at", { ascending: false }),

      supabase
        .from("finance_transactions")
        .select("id, type, category, description, amount, transaction_date, created_at")
        .order("created_at", { ascending: false }),

      supabase
        .from("products")
        .select("id, name, sku, price, cost_price, stock_quantity, low_stock_threshold")
        .eq("is_active", true),
    ]);

  if (salesResult.error) throw new Error(salesResult.error.message);
  if (purchasesResult.error) throw new Error(purchasesResult.error.message);
  if (financeResult.error) throw new Error(financeResult.error.message);
  if (productsResult.error) throw new Error(productsResult.error.message);

  const sales = (salesResult.data || []) as Sale[];
  const purchases = (purchasesResult.data || []) as Purchase[];
  const transactions = (financeResult.data || []) as FinanceTransaction[];
  const products = (productsResult.data || []) as Product[];

  /* =========================
      SALES CALCULATIONS
  ========================= */
  const totalSales = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
  const paidSales = sales
    .filter((s) => s.payment_status === "PAID")
    .reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
  const partialSales = sales
    .filter((s) => s.payment_status === "PARTIAL")
    .reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
  const unpaidSales = sales
    .filter((s) => s.payment_status === "UNPAID")
    .reduce((sum, s) => sum + Number(s.total_amount || 0), 0);

  /* =========================
      PURCHASES CALCULATIONS
  ========================= */
  const totalPurchases = purchases.reduce(
    (sum, p) => sum + Number(p.total_amount || 0),
    0
  );

  /* =========================
      FINANCE CALCULATIONS
  ========================= */
  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const netBalance = totalIncome - totalExpenses;

  /* =========================
      INVENTORY CALCULATIONS
  ========================= */
  const totalProducts = products.length;
  const totalUnits = products.reduce((sum, p) => sum + Number(p.stock_quantity || 0), 0);
  const inventoryCostValue = products.reduce(
    (sum, p) => sum + Number(p.stock_quantity || 0) * Number(p.cost_price || 0),
    0
  );
  const inventoryRetailValue = products.reduce(
    (sum, p) => sum + Number(p.stock_quantity || 0) * Number(p.price || 0),
    0
  );
  const potentialProfit = inventoryRetailValue - inventoryCostValue;

  const lowStockProducts = products.filter(
    (p) =>
      Number(p.stock_quantity) > 0 &&
      Number(p.stock_quantity) <= Number(p.low_stock_threshold)
  );
  const outOfStockProducts = products.filter(
    (p) => Number(p.stock_quantity) === 0
  );

  /* =========================
      LAST 30 DAYS
  ========================= */
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const recentSales = sales.filter((s) => new Date(s.created_at) >= thirtyDaysAgo);
  const recentExpenses = transactions.filter(
    (t) => t.type === "EXPENSE" && new Date(t.created_at) >= thirtyDaysAgo
  );

  const last30Sales = recentSales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
  const last30Expenses = recentExpenses.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const last30Profit = last30Sales - last30Expenses;

  /* =========================
      MONTHLY 6-MO CHART DATA
  ========================= */
  const monthlyData = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const year = date.getFullYear();
    const month = date.getMonth();

    const monthSales = sales
      .filter((s) => {
        const saleDate = new Date(s.sale_date);
        return saleDate.getFullYear() === year && saleDate.getMonth() === month;
      })
      .reduce((sum, s) => sum + Number(s.total_amount || 0), 0);

    const monthExpenses = transactions
      .filter((t) => {
        const txDate = new Date(t.transaction_date);
        return (
          t.type === "EXPENSE" &&
          txDate.getFullYear() === year &&
          txDate.getMonth() === month
        );
      })
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return {
      month: date.toLocaleDateString("en-US", { month: "short" }),
      sales: monthSales,
      expenses: monthExpenses,
    };
  });

  const maxChartVal = Math.max(
    ...monthlyData.flatMap((m) => [m.sales, m.expenses]),
    1
  );

  const topInventoryProducts = [...products]
    .sort(
      (a, b) =>
        b.stock_quantity * b.cost_price - a.stock_quantity * a.cost_price
    )
    .slice(0, 5);

  return (
    <div className="space-y-8 bg-purple-50/30 p-6 md:p-8 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
            Business Portal
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
            Overview Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Real-time sales, inventory, and financial analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/purchases/new"
            className="inline-flex items-center justify-center rounded-xl border border-purple-200 bg-white px-4 py-2.5 text-sm font-semibold text-purple-900 shadow-sm transition hover:bg-purple-50 hover:border-purple-300"
          >
            + New Purchase
          </Link>
          <Link
            href="/dashboard/sales/new"
            className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-purple-600/30 transition hover:bg-purple-700"
          >
            + New Sale
          </Link>
        </div>
      </div>

      {/* PRIMARY KPIS */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Sales"
          value={formatCurrency(totalSales)}
          description={`${sales.length} orders settled`}
          icon="↗"
        />
        <StatCard
          title="Total Purchases"
          value={formatCurrency(totalPurchases)}
          description={`${purchases.length} stock receipts`}
          icon="↙"
        />
        <StatCard
          title="Net Cashflow"
          value={formatCurrency(netBalance)}
          description="Total income vs expenses"
          icon="◈"
        />
        <StatCard
          title="Inventory Valuation"
          value={formatCurrency(inventoryCostValue)}
          description={`${totalUnits.toLocaleString()} units on hand`}
          icon="▣"
        />
      </div>

      {/* SECONDARY METRICS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniCard
          title="Settled Revenue"
          value={formatCurrency(paidSales)}
          badge="Healthy"
          accent="purple"
        />
        <MiniCard
          title="Pending Receivables"
          value={formatCurrency(partialSales + unpaidSales)}
          badge="Awaiting"
          accent="amber"
        />
        <MiniCard
          title="Operational Expenses"
          value={formatCurrency(totalExpenses)}
          badge="Overhead"
          accent="slate"
        />
        <MiniCard
          title="Expected Inventory Margin"
          value={formatCurrency(potentialProfit)}
          badge="Potential"
          accent="purple"
        />
      </div>

      {/* CHARTS & 30-DAY SUMMARY */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* REVENUE VS EXPENSES */}
        <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm shadow-purple-100/50 lg:col-span-2">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Revenue vs. Expense Activity
              </h2>
              <p className="text-xs text-gray-500">
                Monthly trends over the last 6 months
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-gray-600">
                <span className="h-2.5 w-2.5 rounded-sm bg-purple-600" />
                Sales
              </span>
              <span className="flex items-center gap-1.5 text-gray-600">
                <span className="h-2.5 w-2.5 rounded-sm bg-purple-200" />
                Expenses
              </span>
            </div>
          </div>

          <div className="mt-8 flex h-64 items-end gap-3 sm:gap-6">
            {monthlyData.map((item) => {
              const salesHeight = (item.sales / maxChartVal) * 100;
              const expenseHeight = (item.expenses / maxChartVal) * 100;

              return (
                <div
                  key={item.month}
                  className="group relative flex h-full flex-1 flex-col items-center justify-end"
                >
                  <div className="flex h-full w-full items-end justify-center gap-1.5 sm:gap-2">
                    <div
                      className="w-full max-w-5 rounded-t-md bg-purple-600 transition-all duration-300 group-hover:bg-purple-700"
                      style={{
                        height: `${Math.max(salesHeight, item.sales > 0 ? 4 : 0)}%`,
                      }}
                      title={`Sales: ${formatCurrency(item.sales)}`}
                    />
                    <div
                      className="w-full max-w-5 rounded-t-md bg-purple-200 transition-all duration-300 group-hover:bg-purple-300"
                      style={{
                        height: `${Math.max(expenseHeight, item.expenses > 0 ? 4 : 0)}%`,
                      }}
                      title={`Expenses: ${formatCurrency(item.expenses)}`}
                    />
                  </div>
                  <span className="mt-3 text-xs font-medium text-gray-500">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 30-DAY PERFORMANCE */}
        <div className="flex flex-col justify-between rounded-2xl border border-purple-100 bg-white p-6 shadow-sm shadow-purple-100/50">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Last 30 Days</h2>
              <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700">
                Rolling
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Recent month operating performance.
            </p>

            <div className="mt-6 space-y-4">
              <Metric label="Recent Gross Sales" value={formatCurrency(last30Sales)} />
              <Metric
                label="Recent Expenses"
                value={formatCurrency(last30Expenses)}
              />
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-purple-50/70 p-4 border border-purple-100">
            <p className="text-xs font-medium uppercase tracking-wider text-purple-700">
              Net 30-Day Margin
            </p>
            <p
              className={`mt-1 text-2xl font-black ${
                last30Profit >= 0 ? "text-purple-950" : "text-rose-600"
              }`}
            >
              {formatCurrency(last30Profit)}
            </p>
            <p className="mt-1 text-xs text-purple-600">
              {last30Profit >= 0 ? "Operating at a profit" : "Operating at a loss"}
            </p>
          </div>
        </div>
      </div>

      {/* SALES BREAKDOWN & INVENTORY HEALTH */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* PAYMENT BREAKDOWN */}
        <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm shadow-purple-100/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Sales Collection Status
              </h2>
              <p className="text-xs text-gray-500">Customer payment clearance</p>
            </div>
            <Link
              href="/dashboard/sales"
              className="text-xs font-semibold text-purple-600 hover:text-purple-800"
            >
              View all sales →
            </Link>
          </div>

          <div className="mt-6 space-y-5">
            <ProgressRow
              label="Fully Collected"
              amount={paidSales}
              total={totalSales}
              barColor="bg-purple-600"
            />
            <ProgressRow
              label="Partially Settled"
              amount={partialSales}
              total={totalSales}
              barColor="bg-purple-300"
            />
            <ProgressRow
              label="Outstanding / Unpaid"
              amount={unpaidSales}
              total={totalSales}
              barColor="bg-rose-400"
            />
          </div>
        </div>

        {/* INVENTORY STATS */}
        <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm shadow-purple-100/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Inventory Overview
              </h2>
              <p className="text-xs text-gray-500">Catalog status & valuation</p>
            </div>
            <Link
              href="/dashboard/inventory"
              className="text-xs font-semibold text-purple-600 hover:text-purple-800"
            >
              Open stock →
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <InventoryStat label="Total SKUs" value={totalProducts} />
            <InventoryStat
              label="Low Stock"
              value={lowStockProducts.length}
              alert={lowStockProducts.length > 0}
            />
            <InventoryStat
              label="Depleted"
              value={outOfStockProducts.length}
              danger={outOfStockProducts.length > 0}
            />
          </div>

          <div className="mt-5 rounded-xl border border-purple-100 bg-purple-50/40 p-4">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Total Retail Value</span>
              <span className="font-bold text-gray-900">
                {formatCurrency(inventoryRetailValue)}
              </span>
            </div>
            <div className="mt-2.5 flex justify-between text-xs">
              <span className="text-gray-600">Total Cost Baseline</span>
              <span className="font-bold text-gray-900">
                {formatCurrency(inventoryCostValue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CRITICAL STOCK ALERTS */}
      <div className="rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50">
        <div className="flex items-center justify-between border-b border-purple-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Stock Alerts</h2>
            <p className="text-xs text-gray-500">
              Items approaching or at minimum threshold
            </p>
          </div>
          <Link
            href="/dashboard/inventory"
            className="text-xs font-semibold text-purple-600 hover:text-purple-800"
          >
            Manage inventory →
          </Link>
        </div>

        {lowStockProducts.length > 0 || outOfStockProducts.length > 0 ? (
          <div className="divide-y divide-purple-50">
            {[...outOfStockProducts, ...lowStockProducts]
              .slice(0, 6)
              .map((product) => {
                const outOfStock = product.stock_quantity === 0;
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between px-6 py-3.5 transition hover:bg-purple-50/40"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-400">SKU: {product.sku}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        outOfStock
                          ? "bg-rose-50 text-rose-600 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {outOfStock ? "Out of stock" : `${product.stock_quantity} left`}
                    </span>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 mb-2">
              ✓
            </span>
            <p className="text-sm font-semibold text-purple-900">
              Inventory levels optimal
            </p>
            <p className="text-xs text-gray-500">
              No products are currently under their threshold.
            </p>
          </div>
        )}
      </div>

      {/* RECENT ACTIVITY: SALES & PURCHASES */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* RECENT SALES */}
        <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50">
          <div className="flex items-center justify-between border-b border-purple-100 px-6 py-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Recent Sales</h2>
              <p className="text-xs text-gray-500">Customer transactions</p>
            </div>
            <Link
              href="/dashboard/sales"
              className="text-xs font-semibold text-purple-600 hover:text-purple-800"
            >
              View all →
            </Link>
          </div>

          {sales.length > 0 ? (
            <div className="divide-y divide-purple-50">
              {sales.slice(0, 5).map((sale) => (
                <Link
                  key={sale.id}
                  href={`/dashboard/sales/${sale.id}`}
                  className="flex items-center justify-between px-6 py-3.5 transition hover:bg-purple-50/50"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {sale.customer_name || "Walk-in Customer"}
                    </p>
                    <p className="text-xs text-gray-400">{sale.sale_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(Number(sale.total_amount))}
                    </p>
                    <StatusBadge status={sale.payment_status} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState text="No sales recorded yet." />
          )}
        </div>

        {/* RECENT PURCHASES */}
        <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50">
          <div className="flex items-center justify-between border-b border-purple-100 px-6 py-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">Recent Purchases</h2>
              <p className="text-xs text-gray-500">Supplier acquisitions</p>
            </div>
            <Link
              href="/dashboard/purchases"
              className="text-xs font-semibold text-purple-600 hover:text-purple-800"
            >
              View all →
            </Link>
          </div>

          {purchases.length > 0 ? (
            <div className="divide-y divide-purple-50">
              {purchases.slice(0, 5).map((purchase) => (
                <Link
                  key={purchase.id}
                  href={`/dashboard/purchases/${purchase.id}`}
                  className="flex items-center justify-between px-6 py-3.5 transition hover:bg-purple-50/50"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {purchase.supplier_name}
                    </p>
                    <p className="text-xs text-gray-400">{purchase.purchase_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(Number(purchase.total_amount))}
                    </p>
                    <StatusBadge status={purchase.payment_status} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState text="No purchases recorded yet." />
          )}
        </div>
      </div>

      {/* TOP VALUE INVENTORY */}
      <div className="rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50">
        <div className="border-b border-purple-100 px-6 py-4">
          <h2 className="text-base font-bold text-gray-900">
            Top Stock Capital Allocation
          </h2>
          <p className="text-xs text-gray-500">
            Products holding the greatest aggregate balance
          </p>
        </div>

        {topInventoryProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-purple-100 bg-purple-50/50">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-purple-900">
                    Product
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-purple-900">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-purple-900">
                    Units
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-purple-900">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-purple-900">
                    Total Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {topInventoryProducts.map((product) => (
                  <tr key={product.id} className="transition hover:bg-purple-50/30">
                    <td className="px-6 py-3.5 font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-gray-500">
                      {product.sku}
                    </td>
                    <td className="px-6 py-3.5 text-right font-medium text-gray-700">
                      {product.stock_quantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-right text-gray-600">
                      {formatCurrency(Number(product.cost_price))}
                    </td>
                    <td className="px-6 py-3.5 text-right font-bold text-purple-950">
                      {formatCurrency(
                        Number(product.cost_price) * Number(product.stock_quantity)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="No product assets available." />
        )}
      </div>

      {/* QUICK LAUNCH ACTIONS */}
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-purple-900">
          Quick Workflows
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <QuickAction
            href="/dashboard/sales/new"
            title="Create Sale"
            description="Process checkout"
          />
          <QuickAction
            href="/dashboard/purchases/new"
            title="Stock In"
            description="Log supplier order"
          />
          <QuickAction
            href="/dashboard/products/new"
            title="New Product"
            description="Add item to inventory"
          />
          <QuickAction
            href="/dashboard/finance/new"
            title="Post Transaction"
            description="Track expense or income"
          />
          <QuickAction
            href="/dashboard/users"
            title="Team & Access"
            description="Manage system roles"
          />
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
    UI COMPONENTS (PURPLE & WHITE SYSTEM)
========================================================================= */

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-purple-100 bg-white p-5 shadow-sm shadow-purple-100/50 transition hover:shadow-md hover:border-purple-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
            {title}
          </p>
          <p className="mt-2 text-2xl font-black tracking-tight text-gray-950">
            {value}
          </p>
          <p className="mt-1 text-xs text-gray-400">{description}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 font-bold text-purple-700 border border-purple-100">
          {icon}
        </div>
      </div>
    </div>
  );
}

function MiniCard({
  title,
  value,
  badge,
  accent,
}: {
  title: string;
  value: string;
  badge: string;
  accent: "purple" | "amber" | "slate";
}) {
  const accentClasses = {
    purple: "text-purple-700 bg-purple-50 border-purple-100",
    amber: "text-amber-700 bg-amber-50 border-amber-100",
    slate: "text-slate-700 bg-slate-50 border-slate-100",
  }[accent];

  return (
    <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm shadow-purple-100/40">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500">{title}</p>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${accentClasses}`}
        >
          {badge}
        </span>
      </div>
      <p className="mt-2 text-xl font-bold tracking-tight text-gray-900">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-purple-50 pb-2.5 last:border-0 last:pb-0">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-sm font-bold text-gray-900">{value}</span>
    </div>
  );
}

function ProgressRow({
  label,
  amount,
  total,
  barColor,
}: {
  label: string;
  amount: number;
  total: number;
  barColor: string;
}) {
  const percentage =
    total > 0 ? Math.min((amount / total) * 100, 100) : 0;

  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="font-medium text-gray-600">{label}</span>
        <span className="font-bold text-gray-900">
          {formatCurrency(amount)}{" "}
          <span className="text-gray-400 font-normal">
            ({percentage.toFixed(0)}%)
          </span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-purple-50">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function InventoryStat({
  label,
  value,
  alert = false,
  danger = false,
}: {
  label: string;
  value: number;
  alert?: boolean;
  danger?: boolean;
}) {
  let color = "text-purple-950";
  let bg = "bg-purple-50/50 border-purple-100";

  if (danger) {
    color = "text-rose-600";
    bg = "bg-rose-50 border-rose-100";
  } else if (alert) {
    color = "text-amber-600";
    bg = "bg-amber-50 border-amber-100";
  }

  return (
    <div className={`rounded-xl border p-3.5 text-center ${bg}`}>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="mt-1 text-[11px] font-medium text-gray-500">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: "PAID" | "PARTIAL" | "UNPAID" }) {
  const styles = {
    PAID: "bg-purple-100 text-purple-700 border-purple-200",
    PARTIAL: "bg-amber-50 text-amber-700 border-amber-200",
    UNPAID: "bg-rose-50 text-rose-700 border-rose-200",
  }[status];

  return (
    <span
      className={`inline-block mt-0.5 rounded-full border px-2 py-0.5 text-[10px] font-bold ${styles}`}
    >
      {status}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="px-6 py-10 text-center">
      <p className="text-xs font-medium text-gray-400">{text}</p>
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