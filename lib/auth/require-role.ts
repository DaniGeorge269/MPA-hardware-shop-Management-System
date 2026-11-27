import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { mfaPending } from "@/lib/auth/require-aal";

type Role = "ADMIN" | "STAFF" | "FINANCE";

export async function requireRole(
  allowedRoles: Role[],
  redirectPath = "/dashboard"
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (await mfaPending(supabase)) {
    redirect(
      `/mfa?redirect=${encodeURIComponent(
        redirectPath
      )}`
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) {
    redirect("/login");
  }

  if (!allowedRoles.includes(profile.role as Role)) {
    redirect("/dashboard");
  }

  return {
    user,
    profile,
  };
}