"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  name: string;
  sku: string;
  cost_price: number;
  stock_quantity: number;
};

type PurchaseItem = {
 productId: string;
  quantity: number;
  unitCost: number;
};

type PaymentStatus = "PAID" | "PARTIAL" | "UNPAID";

export default function PurchaseForm({
  products,
}: {
  products: Product[];
}) {
  const router = useRouter();

  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [items, setItems] = useState<PurchaseItem[]>([
    {
      productId: "",
      quantity: 1,
      unitCost: 0,
    },
  ]);

  const [discount, setDiscount] = useState(0);
  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>("PAID");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subtotal = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total + item.quantity * item.unitCost,
      0
    );
  }, [items]);

  const total = Math.max(subtotal - discount, 0);

  function updateItem(
    index: number,
    field: keyof PurchaseItem,
    value: string | number
  ) {
    setItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        return {
          ...item,
          [field]: value,
        };
      })
    );
  }

  function handleProductChange(
    index: number,
    productId: string
  ) {
    const product = products.find(
      (item) => item.id === productId
    );

    setItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        return {
          ...item,
          productId,
          unitCost: product
            ? Number(product.cost_price)
            : 0,
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
        unitCost: 0,
      },
    ]);
  }

  function removeItem(index: number) {
    setItems((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter(
        (_, itemIndex) => itemIndex !== index
      );
    });
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    if (!supplierName.trim()) {
      setError("Supplier name is required.");
      return;
    }

    if (items.length === 0) {
      setError("Add at least one product.");
      return;
    }

    if (items.some((item) => !item.productId)) {
      setError("Please select a product for every item.");
      return;
    }

    if (
      items.some(
        (item) =>
          item.quantity <= 0 ||
          item.unitCost < 0
      )
    ) {
      setError(
        "Quantity must be greater than 0 and cost cannot be negative."
      );
      return;
    }

    const productIds = items.map(
      (item) => item.productId
    );

    if (
      new Set(productIds).size !==
      productIds.length
    ) {
      setError(
        "The same product cannot be added twice."
      );
      return;
    }

    if (discount < 0 || discount > subtotal) {
      setError(
        "Discount cannot be greater than the subtotal."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/purchases",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            supplierName,
            supplierPhone,
            purchaseDate,
            items,
            discount,
            paymentStatus,
            paymentMethod,
            notes,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error || "Failed to create purchase."
        );
        return;
      }

      router.push("/dashboard/purchases");
      router.refresh();
    } catch {
      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Supplier */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Supplier Information
        </h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Supplier Name
            </label>

            <input
              type="text"
              value={supplierName}
              onChange={(e) =>
                setSupplierName(e.target.value)
              }
              placeholder="Supplier name"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Supplier Phone
            </label>

            <input
              type="tel"
              value={supplierPhone}
              onChange={(e) =>
                setSupplierPhone(e.target.value)
              }
              placeholder="+211..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Purchase Date
            </label>

            <input
              type="date"
              value={purchaseDate}
              onChange={(e) =>
                setPurchaseDate(e.target.value)
              }
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Products
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Add products received from the supplier.
            </p>
          </div>

          <button
            type="button"
            onClick={addItem}
            className="rounded-lg border border-green-600 px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50"
          >
            + Add Product
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 p-4"
            >
              <div className="grid gap-4 md:grid-cols-12">
                <div className="md:col-span-5">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Product
                  </label>

                  <select
                    value={item.productId}
                    onChange={(e) =>
                      handleProductChange(
                        index,
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
                      >
                        {product.name} — {product.sku}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Quantity
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(
                        index,
                        "quantity",
                        Number(e.target.value)
                      )
                    }
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Unit Cost
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitCost}
                    onChange={(e) =>
                      updateItem(
                        index,
                        "unitCost",
                        Number(e.target.value)
                      )
                    }
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                </div>

                <div className="flex items-end md:col-span-2">
                  <button
                    type="button"
                    onClick={() =>
                      removeItem(index)
                    }
                    disabled={items.length === 1}
                    className="w-full rounded-lg border border-red-200 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="mt-3 text-right text-sm text-gray-500">
                Item total:{" "}
                <span className="font-semibold text-gray-900">
                  $
                  {(
                    item.quantity * item.unitCost
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Payment & Notes
        </h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Discount
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={discount}
              onChange={(e) =>
                setDiscount(Number(e.target.value))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Payment Status
            </label>

            <select
              value={paymentStatus}
              onChange={(e) =>
                setPaymentStatus(
                  e.target.value as PaymentStatus
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
              <option value="">
                Select method
              </option>
              <option value="CASH">Cash</option>
              <option value="BANK">Bank</option>
              <option value="MOBILE_MONEY">
                Mobile Money
              </option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Notes
            </label>

            <input
              type="text"
              value={notes}
              onChange={(e) =>
                setNotes(e.target.value)
              }
              placeholder="Optional notes"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="ml-auto max-w-sm space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm text-gray-600">
            <span>Discount</span>
            <span>-${discount.toFixed(2)}</span>
          </div>

          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-900">
                Total
              </span>

              <span className="text-xl font-bold text-gray-900">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Creating Purchase..."
              : "Create Purchase"}
          </button>
        </div>
      </div>
    </form>
  );
}