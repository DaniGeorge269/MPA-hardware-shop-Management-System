"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProductForm() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    description: "",
    category: "",
    brand: "",
    price: "",
    cost_price: "",
    stock_quantity: "",
    low_stock_threshold: "5",
  });

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleImageChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) {
      setImageFile(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setError("");
    setImageFile(file);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    if (!form.name.trim()) {
      setError("Product name is required.");
      setLoading(false);
      return;
    }

    if (!form.sku.trim()) {
      setError("SKU is required.");
      setLoading(false);
      return;
    }

    let imageUrl: string | null = null;

    /*
     * Upload product image
     */
    if (imageFile) {
      const fileExtension =
        imageFile.name.split(".").pop()?.toLowerCase() || "jpg";

      const fileName = `${crypto.randomUUID()}.${fileExtension}`;

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(fileName, imageFile);

      if (uploadError) {
        setError(uploadError.message);
        setLoading(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("products")
        .getPublicUrl(fileName);

      imageUrl = publicUrl;
    }

    /*
     * Create product
     */
    const { error: productError } = await supabase
      .from("products")
      .insert({
        name: form.name.trim(),
        sku: form.sku.trim().toUpperCase(),
        description: form.description.trim() || null,
        category: form.category.trim() || null,
        brand: form.brand.trim() || null,
        price: Number(form.price) || 0,
        cost_price: Number(form.cost_price) || 0,
        stock_quantity: Number(form.stock_quantity) || 0,
        low_stock_threshold:
          Number(form.low_stock_threshold) || 5,
        image_url: imageUrl,
      });

    if (productError) {
      setError(productError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard/products");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border border-gray-200 bg-white p-6"
    >
      {/* Basic Information */}
      <div>
        <h2 className="font-semibold text-gray-900">
          Basic Information
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Enter the main details of the product.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Product Name */}
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Product Name *
          </label>

          <input
            value={form.name}
            onChange={(e) =>
              updateField("name", e.target.value)
            }
            placeholder="e.g. Bosch Hammer Drill"
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* SKU */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            SKU *
          </label>

          <input
            value={form.sku}
            onChange={(e) =>
              updateField("sku", e.target.value)
            }
            placeholder="e.g. BHD-001"
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm uppercase outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* Brand */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Brand
          </label>

          <input
            value={form.brand}
            onChange={(e) =>
              updateField("brand", e.target.value)
            }
            placeholder="e.g. Bosch"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* Category */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Category
          </label>

          <input
            value={form.category}
            onChange={(e) =>
              updateField("category", e.target.value)
            }
            placeholder="e.g. Power Tools"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* Product Image */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Product Image
          </label>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
          />

          <p className="mt-1 text-xs text-gray-400">
            JPG, PNG or WEBP. Maximum 5MB.
          </p>

          {imageFile && (
            <p className="mt-2 text-xs text-green-600">
              Selected: {imageFile.name}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Description
          </label>

          <textarea
            value={form.description}
            onChange={(e) =>
              updateField("description", e.target.value)
            }
            placeholder="Describe the product..."
            rows={4}
            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </div>
      </div>

      {/* Pricing & Stock */}
      <div className="border-t border-gray-100 pt-6">
        <h2 className="font-semibold text-gray-900">
          Pricing & Stock
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Set pricing and initial inventory.
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {/* Selling Price */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Selling Price
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) =>
                updateField("price", e.target.value)
              }
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* Cost Price */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Cost Price
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={form.cost_price}
              onChange={(e) =>
                updateField("cost_price", e.target.value)
              }
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* Initial Stock */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Initial Stock
            </label>

            <input
              type="number"
              min="0"
              value={form.stock_quantity}
              onChange={(e) =>
                updateField(
                  "stock_quantity",
                  e.target.value
                )
              }
              placeholder="0"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* Low Stock */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Low Stock Alert
            </label>

            <input
              type="number"
              min="0"
              value={form.low_stock_threshold}
              onChange={(e) =>
                updateField(
                  "low_stock_threshold",
                  e.target.value
                )
              }
              placeholder="5"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Product"}
        </button>
      </div>
    </form>
  );
}