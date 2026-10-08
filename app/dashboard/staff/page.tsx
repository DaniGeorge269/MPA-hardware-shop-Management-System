import Link from "next/link";
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

export default async function StaffPage() {
  await requireRole(["ADMIN"]);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
        id,
        full_name,
        email,
        phone,
        role,
        is_active,
        created_at
      `
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const profiles = (data || []) as Profile[];

  const totalUsers = profiles.length;
  const activeUsers = profiles.filter((user) => user.is_active).length;
  const inactiveUsers = profiles.filter((user) => !user.is_active).length;
  const adminCount = profiles.filter((user) => user.role === "ADMIN").length;
  const staffCount = profiles.filter((user) => user.role === "STAFF").length;
  const financeCount = profiles.filter((user) => user.role === "FINANCE").length;

  return (
    <div className="min-h-screen space-y-8 bg-purple-50/30 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-0.5 text-xs font-semibold text-purple-700">
            Personnel Directory
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
            Staff Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage employees, roles and account access permissions.
          </p>
        </div>

        <Link
          href="/dashboard/users/new"
          className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-purple-600/30 transition hover:bg-purple-700"
        >
          + Add Staff
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard
          title="Total Staff"
          value={totalUsers}
          description="All system accounts"
        />

        <SummaryCard
          title="Active"
          value={activeUsers}
          description="Currently active"
          valueClass="text-purple-700"
        />

        <SummaryCard
          title="Inactive"
          value={inactiveUsers}
          description="Disabled accounts"
          valueClass={inactiveUsers > 0 ? "text-rose-600" : "text-gray-900"}
        />

        <SummaryCard
          title="Operations"
          value={staffCount}
          description="Floor staff accounts"
        />

        <SummaryCard
          title="Finance"
          value={financeCount}
          description="Treasury accounts"
        />
      </div>

      {/* Role Overview */}
      <div className="grid gap-5 md:grid-cols-3">
        <RoleCard
          title="Administrators"
          count={adminCount}
          description="Full system control, roles, and master records."
          badge="ADMIN"
          accent="purple"
        />

        <RoleCard
          title="Store Staff"
          count={staffCount}
          description="Inventory tracking, catalog edits, and sales checkouts."
          badge="STAFF"
          accent="slate"
        />

        <RoleCard
          title="Finance Team"
          count={financeCount}
          description="Supplier invoices, purchase receipts, and cashflow logs."
          badge="FINANCE"
          accent="indigo"
        />
      </div>

      {/* Staff Table */}
      <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50">
        <div className="border-b border-purple-100 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Authorized Personnel
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Staff accounts with verified credential access.
              </p>
            </div>
            <span className="rounded-full border border-purple-100 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
              {profiles.length} total
            </span>
          </div>
        </div>

        {profiles.length > 0 ? (
          <>
            {/* Desktop View */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-purple-100 bg-purple-50/50">
                  <tr>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-purple-900">
                      Staff Member
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-purple-900">
                      Contact
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-purple-900">
                      Role
                    </th>
                    <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-purple-900">
                      Status
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-purple-900">
                      Joined
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-purple-900">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-purple-50">
                  {profiles.map((user) => (
                    <tr
                      key={user.id}
                      className="transition hover:bg-purple-50/40"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-200/80 bg-purple-100 text-xs font-bold text-purple-700">
                            {getInitials(user.full_name)}
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900">
                              {user.full_name || "Unnamed User"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {user.email || "No email"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs font-medium text-gray-600">
                        {user.phone || "—"}
                      </td>

                      <td className="px-6 py-4">
                        <RoleBadge role={user.role} />
                      </td>

                      <td className="px-6 py-4 text-center">
                        <StatusBadge active={user.is_active} />
                      </td>

                      <td className="px-6 py-4 text-xs text-gray-500">
                        {formatDate(user.created_at)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/staff/${user.id}`}
                          className="text-xs font-semibold text-purple-600 hover:text-purple-800"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="divide-y divide-purple-50 md:hidden">
              {profiles.map((user) => (
                <div key={user.id} className="p-4 transition hover:bg-purple-50/20">
                  <div className="flex gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-200/80 bg-purple-100 text-xs font-bold text-purple-700">
                      {getInitials(user.full_name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {user.full_name || "Unnamed User"}
                          </p>
                          <p className="truncate text-xs text-gray-400">
                            {user.email || "No email"}
                          </p>
                        </div>

                        <StatusBadge active={user.is_active} />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <RoleBadge role={user.role} />
                        <span className="text-[11px] text-gray-400">
                          Joined {formatDate(user.created_at)}
                        </span>
                      </div>

                      <div className="mt-3">
                        <Link
                          href={`/dashboard/staff/${user.id}`}
                          className="inline-block text-xs font-semibold text-purple-600 hover:text-purple-800"
                        >
                          View profile →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-xl font-bold text-purple-700">
              👥
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              No staff accounts found
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Register employee accounts to delegate dashboard access.
            </p>
            <div className="mt-5">
              <Link
                href="/dashboard/users/new"
                className="inline-flex items-center rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700"
              >
                + Register Staff
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  valueClass = "text-gray-950",
}: {
  title: string;
  value: number;
  description: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm shadow-purple-100/40 transition hover:border-purple-200 hover:shadow-md">
      <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
        {title}
      </p>

      <p className={`mt-2 text-2xl font-black tracking-tight ${valueClass}`}>
        {value}
      </p>

      <p className="mt-1 text-[11px] text-gray-400">{description}</p>
    </div>
  );
}

function RoleCard({
  title,
  count,
  description,
  badge,
  accent,
}: {
  title: string;
  count: number;
  description: string;
  badge: string;
  accent: "purple" | "slate" | "indigo";
}) {
  const badgeClasses = {
    purple: "bg-purple-100 text-purple-800 border-purple-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  }[accent];

  return (
    <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm shadow-purple-100/40">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-gray-900">{title}</p>
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        </div>

        <span
          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${badgeClasses}`}
        >
          {badge}
        </span>
      </div>

      <p className="mt-4 text-3xl font-black tracking-tight text-gray-950">
        {count}
      </p>

      <p className="mt-0.5 text-[11px] text-gray-400">Assigned profiles</p>
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