import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

type Role = "ADMIN" | "STAFF" | "FINANCE";

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    // Check current user's admin permission
    const { data: adminProfile, error: adminError } =
      await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", user.id)
        .single();

    if (
      adminError ||
      !adminProfile ||
      adminProfile.role !== "ADMIN" ||
      !adminProfile.is_active
    ) {
      return NextResponse.json(
        { error: "Forbidden." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const fullName =
      typeof body.full_name === "string"
        ? body.full_name.trim()
        : "";

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : "";

    const role = body.role as Role;
    const isActive = body.is_active;

    if (!fullName) {
      return NextResponse.json(
        { error: "Full name is required." },
        { status: 400 }
      );
    }

    if (
      !["ADMIN", "STAFF", "FINANCE"].includes(role)
    ) {
      return NextResponse.json(
        { error: "Invalid role." },
        { status: 400 }
      );
    }

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "Invalid account status." },
        { status: 400 }
      );
    }

    // Prevent an admin from disabling their own account
    if (id === user.id && !isActive) {
      return NextResponse.json(
        {
          error:
            "You cannot deactivate your own account.",
        },
        { status: 400 }
      );
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    const admin = createSupabaseAdmin(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Make sure the target user exists
    const { data: targetProfile, error: targetError } =
      await admin
        .from("profiles")
        .select("id")
        .eq("id", id)
        .single();

    if (targetError || !targetProfile) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    // Update profile
    const { error: profileError } =
      await admin
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phone || null,
          role,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    // Keep Supabase Auth metadata synchronized
    const { error: authError } =
      await admin.auth.admin.updateUserById(id, {
        user_metadata: {
          full_name: fullName,
        },
      });

    if (authError) {
      return NextResponse.json(
        {
          error:
            "Profile updated, but authentication metadata could not be updated.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully.",
    });
  } catch (error) {
    console.error("Update user error:", error);

    return NextResponse.json(
      {
        error: "Failed to update user.",
      },
      {
        status: 500,
      }
    );
  }
}