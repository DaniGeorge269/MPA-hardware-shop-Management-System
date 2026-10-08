import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import StaffEditForm from "@/components/staff/staff-edit-form";

export const dynamic = "force-dynamic";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: "ADMIN" | "STAFF" | "FINANCE";
  is_active: boolean;
};

export default async function EditStaffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN"]);

  const { id } = await params;

  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, is_active")
    .eq("id", id)
    .single();

  if (error || !profile) {
    notFound();
  }

  const user = profile as Profile;

  return (
    <div className="min-h-screen bg-purple-50/30 p-6 md:p-8">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Navigation & Header */}
        <div>
          <Link
            href={`/dashboard/staff/${id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 transition hover:text-purple-800"
          >
            ← Back to Staff Details
          </Link>

          <div className="mt-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-0.5 text-xs font-semibold text-purple-700">
              Account Configuration
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
              Edit Staff Account
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Update user details, assign system access roles, or toggle account status.
            </p>
          </div>
        </div>

        {/* Form Card Container */}
        <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50">
          <div className="border-b border-purple-100 bg-purple-50/40 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-purple-900">
                Staff Profile Information
              </h2>
              <span className="font-mono text-[11px] text-gray-400">
                UID: {user.id.slice(0, 8)}...
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <StaffEditForm
              user={{
                id: user.id,
                full_name: user.full_name || "",
                email: user.email || "",
                phone: user.phone || "",
                role: user.role,
                is_active: user.is_active,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}