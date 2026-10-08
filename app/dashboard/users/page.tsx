import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import CreateUserForm from "@/components/users/create-user-form";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requireRole(["ADMIN"]);

  const supabase = await createClient();

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="min-h-screen space-y-8 bg-purple-50/30 p-6 md:p-8">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-0.5 text-xs font-semibold text-purple-700">
            Access Control & Governance
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
            User Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Provision team credentials, allocate system roles, and audit account statuses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-white px-3.5 py-2 text-xs font-semibold text-purple-900 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-purple-600" />
            {users?.length || 0} Total Account{(users?.length || 0) !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* CREATE USER CARD / FORM CONTAINER */}
      <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm shadow-purple-100/50">
        <div className="mb-5 border-b border-purple-50 pb-4">
          <h2 className="text-base font-bold text-gray-900">
            Register New User
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Send an onboarding invite with role-tailored authorization.
          </p>
        </div>
        <CreateUserForm />
      </div>

      {/* USERS TABLE */}
      <div className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm shadow-purple-100/50">
        <div className="flex items-center justify-between border-b border-purple-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Existing Accounts
            </h2>
            <p className="text-xs text-gray-500">
              Active operators with database permissions
            </p>
          </div>
          <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 border border-purple-100">
            {users?.length || 0} user{(users?.length || 0) !== 1 ? "s" : ""}
          </span>
        </div>

        {users && users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-purple-100 bg-purple-50/50">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-purple-900">
                    User
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-purple-900">
                    Email Address
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-purple-900">
                    Phone
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-purple-900">
                    Role
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-purple-900">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-purple-900">
                    Registered
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-purple-50">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="transition hover:bg-purple-50/40"
                  >
                    {/* NAME WITH INITIAL AVATAR */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-purple-200/80 bg-purple-100 text-xs font-bold text-purple-700">
                          {(user.full_name || "U").charAt(0).toUpperCase()}
                        </div>
                        <p className="font-semibold text-gray-900">
                          {user.full_name || "Unnamed User"}
                        </p>
                      </div>
                    </td>

                    {/* EMAIL */}
                    <td className="px-6 py-4 text-xs font-medium text-gray-600">
                      {user.email || "—"}
                    </td>

                    {/* PHONE */}
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {user.phone || "—"}
                    </td>

                    {/* ROLE BADGES */}
                    <td className="px-6 py-4">
                      {user.role === "ADMIN" && (
                        <span className="inline-flex items-center rounded-full border border-purple-300 bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-800">
                          Admin
                        </span>
                      )}

                      {user.role === "STAFF" && (
                        <span className="inline-flex items-center rounded-full border border-purple-100 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                          Staff
                        </span>
                      )}

                      {user.role === "FINANCE" && (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                          Finance
                        </span>
                      )}
                    </td>

                    {/* STATUS BADGES */}
                    <td className="px-6 py-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* CREATED DATE */}
                    <td className="whitespace-nowrap px-6 py-4 text-right text-xs text-gray-500">
                      {new Date(user.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 font-bold text-xl">
              👥
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              No users registered
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Submit the form above to add your first user profile.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}