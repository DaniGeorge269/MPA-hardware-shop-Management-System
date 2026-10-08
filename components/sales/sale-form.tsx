"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
};

type SaleItem = {
  productId: string;
  quantity: number;
};

export default function SaleForm({
  products,
}: {
  products: Product[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [items, setItems] = useState<SaleItem[]>([
    {
      productId: "",
      quantity: 1,
    },
  ]);

  const [discount, setDiscount] = useState("0");
  const [paymentStatus, setPaymentStatus] = useState<
    "PAID" | "PARTIAL" | "UNPAID"
  >("PAID");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subtotal = useMemo(() => {
    return items.reduce((total, item) => {
      const product = products.find(
        (product) => product.id === item.productId
      );

      if (!product) return total;

      return total + Number(product.price) * item.quantity;
    }, 0);
  }, [items, products]);

  const total = Math.max(
    0,
    subtotal - Number(discount || 0)
  );

  function updateItem(
    index: number,
    field: keyof SaleItem,
    value: string
  ) {
    setItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        if (field === "quantity") {
          return {
            ...item,
            quantity: Math.max(1, Number(value) || 1),
          };
        }

        return {
          ...item,
          productId: value,
        };
      })
    );
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        productId: "",
        quantity: 1,
      },
    ]);
  }

  function removeItem(index: number) {
    if (items.length === 1) return;

    setItems((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const validItems = items.filter(
        (item) => item.productId
      );

      if (validItems.length === 0) {
        setError("Please add at least one product.");
        setLoading(false);
        return;
      }

      const duplicateProducts = new Set<string>();

      for (const item of validItems) {
        if (duplicateProducts.has(item.productId)) {
          setError(
            "A product cannot be added more than once."
          );
          setLoading(false);
          return;
        }

        duplicateProducts.add(item.productId);

        const product = products.find(
          (product) => product.id === item.productId
        );

        if (!product) {
          setError("One of the selected products is invalid.");
          setLoading(false);
          return;
        }

        if (item.quantity > product.stock_quantity) {
          setError(
            `${product.name} only has ${product.stock_quantity} in stock.`
          );
          setLoading(false);
          return;
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in.");
        setLoading(false);
        return;
      }

      const { data: sale, error: saleError } =
        await supabase
          .from("sales")
          .insert({
            customer_name: customerName || null,
            customer_phone: customerPhone || null,
            subtotal,
            discount: Number(discount || 0),
            total_amount: total,
            payment_status: paymentStatus,
            payment_method: paymentMethod || null,
            notes: notes || null,
            sold_by: user.id,
          })
          .select()
          .single();

      if (saleError || !sale) {
        setError(
          saleError?.message || "Failed to create sale."
        );
        setLoading(false);
        return;
      }

      const saleItems = validItems.map((item) => {
        const product = products.find(
          (product) => product.id === item.productId
        )!;

        return {
          sale_id: sale.id,
          product_id: product.id,
          quantity: item.quantity,
          unit_price: Number(product.price),
          total_price:
            Number(product.price) * item.quantity,
        };
      });

      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(saleItems);

      if (itemsError) {
        await supabase
          .from("sales")
          .delete()
          .eq("id", sale.id);

        setError(itemsError.message);
        setLoading(false);
        return;
      }

      for (const item of validItems) {
        const product = products.find(
          (product) => product.id === item.productId
        )!;

        const newStock =
          product.stock_quantity - item.quantity;

        const { error: stockError } = await supabase
          .from("products")
          .update({
            stock_quantity: newStock,
            updated_at: new Date().toISOString(),
          })
          .eq("id", product.id);

        if (stockError) {
          setError(
            `Sale created, but stock update failed: ${stockError.message}`
          );
          setLoading(false);
          return;
        }
      }

      if (paymentStatus === "PAID" && total > 0) {
        const { error: financeError } = await supabase
          .from("finance_transactions")
          .insert({
            type: "INCOME",
            category: "Sales",
            description: `Sale ${sale.id}`,
            amount: total,
            payment_method: paymentMethod || null,
            reference: sale.id,
            transaction_date: new Date()
              .toISOString()
              .split("T")[0],
            recorded_by: user.id,
          });

        if (financeError) {
          setError(
            `Sale created, but finance entry failed: ${financeError.message}`
          );
          setLoading(false);
          return;
        }
      }

      router.push("/dashboard/sales");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border border-gray-200 bg-white p-6"
    >
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Customer */}
      <div>
        <h2 className="text-base font-semibold text-gray-900">
          Customer
        </h2>

        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Customer Name
            </label>

            <input
              value={customerName}
              onChange={(e) =>
                setCustomerName(e.target.value)
              }
              placeholder="Walk-in Customer"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Phone
            </label>

            <input
              value={customerPhone}
              onChange={(e) =>
                setCustomerPhone(e.target.value)
              }
              placeholder="Customer phone"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="border-t border-gray-100 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            Products
          </h2>

          <button
            type="button"
            onClick={addItem}
            className="text-sm font-medium text-green-600 hover:text-green-700"
          >
            + Add Product
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {items.map((item, index) => {
            const product = products.find(
              (product) => product.id === item.productId
            );

            const lineTotal = product
              ? Number(product.price) * item.quantity
              : 0;

            return (
              <div
                key={`${index}-${item.productId}`}
                className="rounded-lg border border-gray-200 p-4"
              >
                <div className="grid gap-3 sm:grid-cols-[1fr_120px_120px_auto] sm:items-end">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">
                      Product
                    </label>

                    <select
                      value={item.productId}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "productId",
                          e.target.value
                        )
                      }
                      required
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    >
                      <option value="">
                        Select product
                      </option>

                      {products.map((product) => (
                        <option
                          key={product.id}
                          value={product.id}
                          disabled={
                            items.some(
                              (otherItem, otherIndex) =>
                                otherIndex !== index &&
                                otherItem.productId ===
                                  product.id
                            )
                          }
                        >
                          {product.name} — {product.sku} (
                          {product.stock_quantity} available)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">
                      Quantity
                    </label>

                    <input
                      type="number"
                      min="1"
                      max={product?.stock_quantity || undefined}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "quantity",
                          e.target.value
                        )
                      }
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">
                      Total
                    </label>

                    <div className="rounded-lg bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-900">
                      ${lineTotal.toFixed(2)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment */}
      <div className="border-t border-gray-100 pt-6">
        <h2 className="text-base font-semibold text-gray-900">
          Payment
        </h2>

        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Payment Status
            </label>

            <select
              value={paymentStatus}
              onChange={(e) =>
                setPaymentStatus(
                  e.target.value as
                    | "PAID"
                    | "PARTIAL"
                    | "UNPAID"
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            >
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Payment Method
            </label>

            <select
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            >
              <option value="">Select method</option>
              <option value="CASH">Cash</option>
              <option value="BANK">Bank Transfer</option>
              <option value="MOBILE_MONEY">
                Mobile Money
              </option>
              <option value="CARD">Card</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Discount + Notes */}
      <div className="border-t border-gray-100 pt-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Discount
            </label>

            <input
              type="number"
              min="0"
              max={subtotal}
              step="0.01"
              value={discount}
              onChange={(e) =>
                setDiscount(e.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Notes
            </label>

            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl bg-gray-50 p-5">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>

        <div className="mt-2 flex justify-between text-sm text-gray-600">
          <span>Discount</span>
          <span>-${Number(discount || 0).toFixed(2)}</span>
        </div>

        <div className="mt-4 flex justify-between border-t border-gray-200 pt-4">
          <span className="font-semibold text-gray-900">
            Total
          </span>

          <span className="text-xl font-bold text-green-600">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
        <button
          type="button"
          onClick={() => router.push("/dashboard/sales")}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating Sale..." : "Create Sale"}
        </button>
      </div>
    </form>
  );
}