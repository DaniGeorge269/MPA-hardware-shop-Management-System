"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Role = "ADMIN" | "STAFF" | "FINANCE";

type StaffUser = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: Role;
  is_active: boolean;
};

export default function StaffEditForm({
  user,
}: {
  user: StaffUser;
}) {
  const router = useRouter();

  const [fullName, setFullName] = useState(user.full_name);
  const [phone, setPhone] = useState(user.phone);
  const [role, setRole] = useState<Role>(user.role);
  const [isActive, setIsActive] = useState(user.is_active);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          role,
          is_active: isActive,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update user.");
      }

      router.push(`/dashboard/staff/${user.id}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50"
    >
      <div className="space-y-6 p-6 sm:p-8">
        {/* Email (Read Only) */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-purple-950">
            Email Address
          </label>

          <input
            type="email"
            value={user.email}
            disabled
            className="w-full rounded-xl border border-purple-100 bg-purple-50/50 px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
          />

          <p className="mt-1 text-xs text-gray-400">
            Email address is tied to authentication and cannot be edited directly.
          </p>
        </div>

        {/* Full Name */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-purple-950">
            Full Name
          </label>

          <input
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Enter full name"
            required
            className="w-full rounded-xl border border-purple-200/80 bg-purple-50/20 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition duration-200 focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-500/15"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-purple-950">
            Phone Number
          </label>

          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Enter phone number"
            className="w-full rounded-xl border border-purple-200/80 bg-purple-50/20 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition duration-200 focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-500/15"
          />
        </div>

        {/* Role Select */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-purple-950">
            Assigned System Role
          </label>

          <select
            value={role}
            onChange={(event) => setRole(event.target.value as Role)}
            className="w-full rounded-xl border border-purple-200/80 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition duration-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-500/15"
          >
            <option value="ADMIN">Administrator (Full Access)</option>
            <option value="STAFF">Staff (Sales & Stock)</option>
            <option value="FINANCE">Finance (Ledgers & Purchasing)</option>
          </select>
        </div>

        {/* Account Status Toggle Card */}
        <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-gray-950">
                Account Access Status
              </p>

              <p className="mt-0.5 text-xs text-gray-500">
                Disabled staff cannot sign in or perform any actions.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsActive((current) => !current)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                isActive ? "bg-purple-600" : "bg-gray-200"
              }`}
              aria-label="Toggle account access status"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                isActive
                  ? "border-purple-200 bg-purple-100 text-purple-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isActive ? "bg-purple-600" : "bg-rose-500"
                }`}
              />
              {isActive ? "Active Account" : "Access Suspended"}
            </span>
          </div>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-xs font-medium text-rose-700">
            {error}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col-reverse gap-3 border-t border-purple-100 bg-purple-50/20 p-6 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push(`/dashboard/staff/${user.id}`)}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-xl border border-purple-200 bg-white px-5 py-2.5 text-xs font-semibold text-purple-900 shadow-sm transition hover:bg-purple-50 hover:border-purple-300 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm shadow-purple-600/30 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}