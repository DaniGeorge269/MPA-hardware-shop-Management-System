import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

type UserRole = "ADMIN" | "STAFF" | "FINANCE";

const allowedRoles: UserRole[] = [
  "ADMIN",
  "STAFF",
  "FINANCE",
];

export async function POST(request: Request) {
  try {
    // --------------------------------------------------
    // 1. Check current logged-in user
    // --------------------------------------------------

    const supabase = await createServerClient();

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // 2. Check current user's role
    // --------------------------------------------------

    const { data: currentProfile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", currentUser.id)
        .single();

    if (
      profileError ||
      !currentProfile ||
      currentProfile.role !== "ADMIN" ||
      !currentProfile.is_active
    ) {
      return NextResponse.json(
        {
          error:
            "Only active administrators can create users.",
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // 3. Read request
    // --------------------------------------------------

    const body = await request.json();

    const {
      fullName,
      email,
      password,
      role,
      phone,
    } = body;

    // --------------------------------------------------
    // 4. Validate
    // --------------------------------------------------

    if (!fullName?.trim()) {
      return NextResponse.json(
        { error: "Full name is required." },
        { status: 400 }
      );
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 6 characters.",
        },
        { status: 400 }
      );
    }

    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid user role." },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 5. Create Supabase Admin client
    // --------------------------------------------------

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const normalizedEmail = email.trim().toLowerCase();

    // --------------------------------------------------
    // 6. Create Auth user
    // --------------------------------------------------

    const {
      data: authData,
      error: authError,
    } =
      await admin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName.trim(),
        },
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        {
          error:
            authError?.message ||
            "Failed to create authentication user.",
        },
        { status: 400 }
      );
    }

    const newUser = authData.user;

    // --------------------------------------------------
    // 7. Create/update profile
    // --------------------------------------------------

    const { error: profileUpsertError } =
      await admin
        .from("profiles")
        .upsert(
          {
            id: newUser.id,
            full_name: fullName.trim(),
            email: normalizedEmail,
            role,
            phone: phone?.trim() || null,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "id",
          }
        );

    if (profileUpsertError) {
      // Delete Auth user if profile creation fails
      await admin.auth.admin.deleteUser(newUser.id);

      return NextResponse.json(
        {
          error:
            "User authentication was created, but the profile could not be created: " +
            profileUpsertError.message,
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 8. Verify profile actually exists
    // --------------------------------------------------

    const { data: createdProfile, error: verifyError } =
      await admin
        .from("profiles")
        .select("id, full_name, email, role, is_active")
        .eq("id", newUser.id)
        .single();

    if (verifyError || !createdProfile) {
      await admin.auth.admin.deleteUser(newUser.id);

      return NextResponse.json(
        {
          error:
            "User was created but the profile could not be verified.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 9. Success
    // --------------------------------------------------

    return NextResponse.json(
      {
        message: "User created successfully.",
        user: createdProfile,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create user error:", error);

    return NextResponse.json(
      {
        error:
          "Something went wrong while creating the user.",
      },
      { status: 500 }
    );
  }
}