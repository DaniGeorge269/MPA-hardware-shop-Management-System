import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: "ADMIN" | "STAFF" | "FINANCE";
  is_active: boolean;
  created_at: string;
};

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN"]);

  const { id } = await params;

  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, is_active, created_at")
    .eq("id", id)
    .single();

  if (error || !profile) {
    notFound();
  }

  const user = profile as Profile;

  return (
    <div className="min-h-screen space-y-8 bg-purple-50/30 p-6 md:p-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/staff"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 transition hover:text-purple-800"
        >
          ← Back to Staff
        </Link>

        <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
              {user.full_name || "Unnamed User"}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Staff account details and system permissions.
            </p>
          </div>

          <Link
            href={`/dashboard/staff/${user.id}/edit`}
            className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-purple-600/30 transition hover:bg-purple-700"
          >
            Edit Staff
          </Link>
        </div>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm shadow-purple-100/50">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-purple-200/80 bg-purple-100 text-2xl font-black text-purple-700 shadow-sm shadow-purple-200/50">
            {getInitials(user.full_name)}
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-tight text-gray-950">
              {user.full_name || "Unnamed User"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {user.email || "No email"}
            </p>

            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <RoleBadge role={user.role} />
              <StatusBadge active={user.is_active} />
            </div>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50">
        <div className="border-b border-purple-100 px-6 py-4">
          <h2 className="text-base font-bold text-gray-900">
            Account Information
          </h2>
          <p className="text-xs text-gray-500">
            Profile credentials and system records
          </p>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-2">
          <Info label="Full Name" value={user.full_name || "—"} />

          <Info label="Email" value={user.email || "—"} />

          <Info label="Phone" value={user.phone || "—"} />

          <Info label="Role" value={user.role} />

          <Info label="Status" value={user.is_active ? "Active" : "Inactive"} />

          <Info label="Joined" value={formatDate(user.created_at)} />

          <Info label="User ID" value={user.id} />
        </div>
      </div>

      {/* Permissions */}
      <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50">
        <div className="border-b border-purple-100 px-6 py-4">
          <h2 className="text-base font-bold text-gray-900">
            Permissions
          </h2>

          <p className="text-xs text-gray-500">
            Access granted based on the user&apos;s role.
          </p>
        </div>

        <div className="grid gap-3.5 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {getPermissions(user.role).map((permission) => (
            <div
              key={permission}
              className="flex items-center gap-3 rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-100 text-xs font-bold text-purple-700">
                ✓
              </span>

              <span className="text-xs font-semibold text-gray-800">
                {permission}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/dashboard/staff/${user.id}/edit`}
          className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-purple-600/30 transition hover:bg-purple-700"
        >
          Edit Staff
        </Link>

        <Link
          href="/dashboard/staff"
          className="inline-flex items-center justify-center rounded-xl border border-purple-200 bg-white px-4 py-2.5 text-xs font-semibold text-purple-900 shadow-sm transition hover:bg-purple-50 hover:border-purple-300"
        >
          Back to Staff
        </Link>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-purple-50 bg-purple-50/30 p-3.5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-purple-900/60">
        {label}
      </p>

      <p className="mt-1 break-all text-xs font-semibold text-gray-900">
        {value}
      </p>
    </div>
  );
}

function RoleBadge({
  role,
}: {
  role: "ADMIN" | "STAFF" | "FINANCE";
}) {
  const styles = {
    ADMIN: "border-purple-300 bg-purple-100 text-purple-800",
    STAFF: "border-purple-100 bg-purple-50 text-purple-700",
    FINANCE: "border-slate-200 bg-slate-100 text-slate-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[role]}`}
    >
      {role}
    </span>
  );
}

function StatusBadge({
  active,
}: {
  active: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        active
          ? "border-purple-200 bg-purple-50 text-purple-700"
          : "border-rose-200 bg-rose-50 text-rose-700"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-purple-600" : "bg-rose-500"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function getInitials(name: string | null) {
  if (!name) return "U";

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getPermissions(
  role: "ADMIN" | "STAFF" | "FINANCE"
) {
  if (role === "ADMIN") {
    return [
      "Dashboard",
      "Products",
      "Inventory",
      "Sales",
      "Purchases",
      "Finance",
      "Staff Management",
      "User Management",
      "Settings",
    ];
  }

  if (role === "STAFF") {
    return [
      "Dashboard",
      "Products",
      "Inventory",
      "Sales",
    ];
  }

  return [
    "Dashboard",
    "Sales",
    "Purchases",
    "Finance",
  ];
}