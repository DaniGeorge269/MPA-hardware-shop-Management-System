import Link from "next/link";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireRole(["ADMIN"]);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone, role, is_active")
    .eq("id", user?.id)
    .single();

  return (
    <div className="min-h-screen space-y-8 bg-purple-50/30 p-6 md:p-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-0.5 text-xs font-semibold text-purple-700">
          Preferences & Configuration
        </div>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
          System Settings
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage administrator profile credentials and configure
          operational modules.
        </p>
      </div>

      {/* Account Section */}
      <section className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50">
        <div className="border-b border-purple-100 bg-purple-50/40 px-6 py-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-purple-900">
            Administrator Account Profile
          </h2>

          <p className="mt-0.5 text-xs text-gray-500">
            Active session authentication and administrative identity
          </p>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <SettingItem
            label="Full Name"
            value={profile?.full_name || "—"}
          />

          <SettingItem
            label="Email Address"
            value={profile?.email || user?.email || "—"}
          />

          <SettingItem
            label="Phone"
            value={profile?.phone || "—"}
          />

          <SettingItem
            label="Assigned Role"
            value={profile?.role || "ADMIN"}
            badge
          />

          <SettingItem
            label="Account Status"
            value={profile?.is_active ? "Active" : "Inactive"}
            status
            active={Boolean(profile?.is_active)}
          />
        </div>
      </section>

      {/* Management Navigation */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-bold text-gray-900">
            Access & Workforce Management
          </h2>

          <p className="text-xs text-gray-500">
            Employee permissions, account invites, and catalog
            configuration
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SettingsCard
            href="/dashboard/staff"
            title="Staff Directory"
            description="Manage staff accounts, assign team roles, and review privileges."
            badge="Directory"
          />

          <SettingsCard
            href="/dashboard/users"
            title="User Management"
            description="Register new system credentials and assign operational roles."
            badge="Security"
          />

          <SettingsCard
            href="/dashboard/products"
            title="Product Catalog"
            description="Maintain active inventory master, retail pricing, and SKUs."
            badge="Inventory"
          />
        </div>
      </section>

      {/* System Modules */}
      <section>
        <div className="mb-4">
          <h2 className="text-base font-bold text-gray-900">
            Operations & Financial Systems
          </h2>

          <p className="text-xs text-gray-500">
            Real-time monitors for stock movement and ledger entries
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SettingsCard
            href="/dashboard/inventory"
            title="Stock Auditing"
            description="Monitor reorder levels, shelf unit counts, and valuation."
            badge="Live Stock"
          />

          <SettingsCard
            href="/dashboard/purchases"
            title="Supplier Orders"
            description="Log inbound purchase orders and track consignments."
            badge="Procurement"
          />

          <SettingsCard
            href="/dashboard/finance"
            title="Treasury Ledger"
            description="Review balance sheets, categorized expenses, and cashflows."
            badge="Ledgers"
          />
        </div>
      </section>

      {/* Security Actions */}
      <section className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50">
        <div className="border-b border-purple-100 px-6 py-4">
          <h2 className="text-base font-bold text-gray-900">
            Account Security & Credentials
          </h2>

          <p className="text-xs text-gray-500">
            Update personal information, password, and two-factor
            authentication.
          </p>
        </div>

        <div className="flex flex-col gap-3 p-6 sm:flex-row sm:flex-wrap">
          <Link
            href="/dashboard/settings/profile"
            className="inline-flex items-center justify-center rounded-xl border border-purple-200 bg-white px-5 py-2.5 text-xs font-semibold text-purple-900 shadow-sm transition hover:border-purple-300 hover:bg-purple-50"
          >
            Edit Profile Info
          </Link>

          <Link
            href="/dashboard/settings/password"
            className="inline-flex items-center justify-center rounded-xl border border-purple-200 bg-white px-5 py-2.5 text-xs font-semibold text-purple-900 shadow-sm transition hover:border-purple-300 hover:bg-purple-50"
          >
            Update Password
          </Link>

          <Link
            href="/dashboard/settings/mfa"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm shadow-purple-600/30 transition hover:bg-purple-700"
          >
            🔐 Two-Factor Authentication
          </Link>
        </div>
      </section>
    </div>
  );
}

function SettingItem({
  label,
  value,
  badge = false,
  status = false,
  active = true,
}: {
  label: string;
  value: string;
  badge?: boolean;
  status?: boolean;
  active?: boolean;
}) {
  return (
    <div className="rounded-xl border border-purple-50 bg-purple-50/30 p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-purple-900/60">
        {label}
      </p>

      {badge ? (
        <div className="mt-1.5">
          <span className="inline-flex items-center rounded-full border border-purple-300 bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800">
            {value}
          </span>
        </div>
      ) : status ? (
        <div className="mt-1.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
              active
                ? "border-purple-200 bg-purple-100 text-purple-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                active ? "bg-purple-600" : "bg-rose-500"
              }`}
            />

            {value}
          </span>
        </div>
      ) : (
        <p className="mt-1 break-all text-sm font-semibold text-gray-900">
          {value}
        </p>
      )}
    </div>
  );
}

function SettingsCard({
  href,
  title,
  description,
  badge,
}: {
  href: string;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between rounded-2xl border border-purple-100 bg-white p-5 shadow-sm shadow-purple-100/40 transition hover:border-purple-300 hover:bg-purple-50/30 hover:shadow-md"
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-gray-900 transition group-hover:text-purple-700">
            {title}
          </h3>

          {badge && (
            <span className="rounded-full border border-purple-100 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
              {badge}
            </span>
          )}
        </div>

        <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
          {description}
        </p>
      </div>

      <p className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-purple-600 transition group-hover:translate-x-0.5 group-hover:text-purple-800">
        Configure & Manage →
      </p>
    </Link>
  );
}