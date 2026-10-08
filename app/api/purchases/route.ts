import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

type PurchaseItem = {
  productId: string;
  quantity: number;
  unitCost: number;
};

type PaymentStatus = "PAID" | "PARTIAL" | "UNPAID";

export async function POST(request: Request) {
  try {
    // Verify logged-in user
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    // Verify role
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", user.id)
        .single();

    if (
      profileError ||
      !profile ||
      !profile.is_active ||
      !["ADMIN", "FINANCE"].includes(profile.role)
    ) {
      return NextResponse.json(
        {
          error:
            "Only active administrators or finance users can create purchases.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      supplierName,
      supplierPhone,
      purchaseDate,
      items,
      discount,
      paymentStatus,
      paymentMethod,
      notes,
    } = body as {
      supplierName: string;
      supplierPhone?: string;
      purchaseDate: string;
      items: PurchaseItem[];
      discount: number;
      paymentStatus: PaymentStatus;
      paymentMethod?: string;
      notes?: string;
    };

    // Basic validation
    if (!supplierName?.trim()) {
      return NextResponse.json(
        { error: "Supplier name is required." },
        { status: 400 }
      );
    }

    if (!purchaseDate) {
      return NextResponse.json(
        { error: "Purchase date is required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one product is required." },
        { status: 400 }
      );
    }

    if (
      !["PAID", "PARTIAL", "UNPAID"].includes(
        paymentStatus
      )
    ) {
      return NextResponse.json(
        { error: "Invalid payment status." },
        { status: 400 }
      );
    }

    if (Number(discount) < 0) {
      return NextResponse.json(
        { error: "Discount cannot be negative." },
        { status: 400 }
      );
    }

    // Prevent duplicate products
    const productIds = items.map(
      (item) => item.productId
    );

    if (
      new Set(productIds).size !== productIds.length
    ) {
      return NextResponse.json(
        {
          error:
            "The same product cannot be added twice.",
        },
        { status: 400 }
      );
    }

    // Validate quantities and costs
    for (const item of items) {
      if (!item.productId) {
        return NextResponse.json(
          { error: "Every purchase item needs a product." },
          { status: 400 }
        );
      }

      if (
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) <= 0
      ) {
        return NextResponse.json(
          {
            error:
              "Product quantity must be a positive whole number.",
          },
          { status: 400 }
        );
      }

      if (Number(item.unitCost) < 0) {
        return NextResponse.json(
          {
            error:
              "Product cost cannot be negative.",
          },
          { status: 400 }
        );
      }
    }

    // Calculate subtotal
    const subtotal = items.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity) *
          Number(item.unitCost),
      0
    );

    const numericDiscount = Number(discount) || 0;

    if (numericDiscount > subtotal) {
      return NextResponse.json(
        {
          error:
            "Discount cannot be greater than the subtotal.",
        },
        { status: 400 }
      );
    }

    const totalAmount =
      subtotal - numericDiscount;

    /*
     * Service-role client.
     *
     * This is used only after the current user has
     * been authenticated and their role verified.
     */
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify all products exist and are active
    const { data: products, error: productsError } =
      await admin
        .from("products")
        .select(
          "id, name, sku, stock_quantity, is_active"
        )
        .in("id", productIds);

    if (productsError) {
      return NextResponse.json(
        {
          error:
            "Failed to verify products: " +
            productsError.message,
        },
        { status: 500 }
      );
    }

    if (
      !products ||
      products.length !== productIds.length
    ) {
      return NextResponse.json(
        {
          error:
            "One or more selected products could not be found.",
        },
        { status: 400 }
      );
    }

    if (products.some((product) => !product.is_active)) {
      return NextResponse.json(
        {
          error:
            "One or more selected products are inactive.",
        },
        { status: 400 }
      );
    }

    /*
     * Create purchase
     */
    const { data: purchase, error: purchaseError } =
      await admin
        .from("purchases")
        .insert({
          supplier_name: supplierName.trim(),
          supplier_phone:
            supplierPhone?.trim() || null,
          subtotal,
          discount: numericDiscount,
          total_amount: totalAmount,
          payment_status: paymentStatus,
          payment_method:
            paymentMethod?.trim() || null,
          notes: notes?.trim() || null,
          purchased_by: user.id,
          purchase_date: purchaseDate,
        })
        .select()
        .single();

    if (purchaseError || !purchase) {
      return NextResponse.json(
        {
          error:
            purchaseError?.message ||
            "Failed to create purchase.",
        },
        { status: 500 }
      );
    }

    /*
     * Create purchase items
     */
    const purchaseItems = items.map((item) => ({
      purchase_id: purchase.id,
      product_id: item.productId,
      quantity: Number(item.quantity),
      unit_cost: Number(item.unitCost),
      total_cost:
        Number(item.quantity) *
        Number(item.unitCost),
    }));

    const { error: itemsError } = await admin
      .from("purchase_items")
      .insert(purchaseItems);

    if (itemsError) {
      // Roll back purchase
      await admin
        .from("purchases")
        .delete()
        .eq("id", purchase.id);

      return NextResponse.json(
        {
          error:
            "Failed to create purchase items: " +
            itemsError.message,
        },
        { status: 500 }
      );
    }

    /*
     * Update inventory
     */
    for (const item of items) {
      const product = products.find(
        (product) => product.id === item.productId
      );

      if (!product) {
        await admin
          .from("purchase_items")
          .delete()
          .eq("purchase_id", purchase.id);

        await admin
          .from("purchases")
          .delete()
          .eq("id", purchase.id);

        return NextResponse.json(
          {
            error:
              "Product could not be found while updating inventory.",
          },
          { status: 500 }
        );
      }

      const newStock =
        Number(product.stock_quantity) +
        Number(item.quantity);

      const { error: stockError } = await admin
        .from("products")
        .update({
          stock_quantity: newStock,
          cost_price: Number(item.unitCost),
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.productId);

      if (stockError) {
        return NextResponse.json(
          {
            error:
              "Purchase was created, but inventory update failed: " +
              stockError.message,
          },
          { status: 500 }
        );
      }
    }

    /*
     * Record finance expense.
     *
     * For now, the full purchase is recorded as an
     * expense when the purchase is PAID.
     */
    if (
      paymentStatus === "PAID" &&
      totalAmount > 0
    ) {
      const { error: financeError } =
        await admin
          .from("finance_transactions")
          .insert({
            type: "EXPENSE",
            category: "Purchases",
            description:
              `Purchase from ${supplierName.trim()}`,
            amount: totalAmount,
            payment_method:
              paymentMethod?.trim() || null,
            reference: purchase.id,
            transaction_date: purchaseDate,
            recorded_by: user.id,
          });

      if (financeError) {
        return NextResponse.json(
          {
            error:
              "Purchase and inventory were created, but the finance transaction failed: " +
              financeError.message,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        message: "Purchase created successfully.",
        purchase,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create purchase error:", error);

    return NextResponse.json(
      {
        error:
          "Something went wrong while creating the purchase.",
      },
      { status: 500 }
    );
  }
}