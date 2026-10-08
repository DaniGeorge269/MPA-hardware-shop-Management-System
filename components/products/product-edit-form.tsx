"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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
};

export default function ProductEditForm({
  product,
}: {
  product: Product;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(product.name);
  const [sku, setSku] = useState(product.sku);
  const [description, setDescription] = useState(
    product.description || ""
  );
  const [category, setCategory] = useState(product.category || "");
  const [brand, setBrand] = useState(product.brand || "");
  const [price, setPrice] = useState(String(product.price));
  const [costPrice, setCostPrice] = useState(
    String(product.cost_price)
  );
  const [stockQuantity, setStockQuantity] = useState(
    String(product.stock_quantity)
  );
  const [lowStockThreshold, setLowStockThreshold] = useState(
    String(product.low_stock_threshold)
  );

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    product.image_url
  );

  const [isActive, setIsActive] = useState(product.is_active);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleImageChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0] || null;

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      e.target.value = "";
      setImageFile(null);
      setImagePreview(product.image_url);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      e.target.value = "";
      setImageFile(null);
      setImagePreview(product.image_url);
      return;
    }

    setError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeNewImage() {
    setImageFile(null);
    setImagePreview(product.image_url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      let imageUrl = product.image_url;

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

      const { error: updateError } = await supabase
        .from("products")
        .update({
          name,
          sku,
          description: description || null,
          category: category || null,
          brand: brand || null,
          price: Number(price),
          cost_price: Number(costPrice),
          stock_quantity: Number(stockQuantity),
          low_stock_threshold: Number(lowStockThreshold),
          image_url: imageUrl,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", product.id);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      router.push("/dashboard/products");
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

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Product Name */}
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Product Name
          </label>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* SKU */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            SKU
          </label>

          <input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* Category */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Category
          </label>

          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* Brand */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Brand
          </label>

          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* Selling Price */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Selling Price
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* Cost Price */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Cost Price
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* Stock Quantity */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Stock Quantity
          </label>

          <input
            type="number"
            min="0"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* Low Stock Threshold */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Low Stock Threshold
          </label>

          <input
            type="number"
            min="0"
            value={lowStockThreshold}
            onChange={(e) =>
              setLowStockThreshold(e.target.value)
            }
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Description
          </label>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* Product Image */}
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Product Image
          </label>

          <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview}
                  alt={name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-gray-400">
                  No image
                </div>
              )}
            </div>

            <div className="flex flex-col items-start gap-2">
              <label
                htmlFor="product-image"
                className="cursor-pointer rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
              >
                {imageFile
                  ? "Change Image"
                  : "Change Product Image"}
              </label>

              <input
                id="product-image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />

              <p className="text-xs text-gray-400">
                JPG, PNG or WebP · Maximum 5MB
              </p>

              {imageFile && (
                <div className="flex items-center gap-2">
                  <p className="max-w-xs truncate text-xs font-medium text-green-600">
                    New image: {imageFile.name}
                  </p>

                  <button
                    type="button"
                    onClick={removeNewImage}
                    className="text-xs font-medium text-red-500 hover:text-red-600"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Status */}
        <div className="sm:col-span-2">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />

            <span className="text-sm font-medium text-gray-700">
              Product is active
            </span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
        <Link
          href="/dashboard/products"
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}