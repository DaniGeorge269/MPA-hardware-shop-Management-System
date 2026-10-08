import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";

import MFASettings from "@/components/settings/mfa-settings";

export const dynamic = "force-dynamic";

export default async function MFASettingsPage() {
  await requireRole(["ADMIN", "STAFF", "FINANCE"]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/dashboard/settings"
          className="text-sm font-medium text-green-600 hover:text-green-700"
        >
          ← Back to Settings
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Two-Factor Authentication
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Add an extra layer of security to your account.
        </p>
      </div>

      <MFASettings />
    </div>
  );
}