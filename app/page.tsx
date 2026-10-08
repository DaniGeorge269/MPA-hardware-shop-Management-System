import AuthButton from "@/components/auth-button";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-purple-50/40 px-4 py-16">
      {/* Brand Background Ambient Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-40 h-120 w-120 rounded-full bg-purple-300/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-40 h-120 w-120 rounded-full bg-purple-400/20 blur-3xl"
      />

      <section className="relative w-full max-w-2xl text-center">
        <div className="rounded-3xl border border-purple-100 bg-white/90 p-8 shadow-xl shadow-purple-900/5 backdrop-blur-xl sm:p-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3.5 py-1 text-xs font-semibold text-purple-700">
            Enterprise Management System
          </div>

          {/* Logo */}
          <div className="mx-auto mt-6 mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600 text-2xl font-black text-white shadow-lg shadow-purple-600/30 ring-4 ring-purple-100">
            M
          </div>

          {/* Title */}
          <h1 className="text-3xl font-black tracking-tight text-gray-950 sm:text-5xl">
            MPA Hardware
          </h1>

          <p className="mt-3 text-base font-semibold text-purple-700 sm:text-lg">
            Hardware Shop Management System
          </p>

          {/* Description */}
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-gray-500 sm:text-base">
            Manage your products, inventory, staff, sales, and finances from
            one centralized, unified dashboard.
          </p>

          {/* Action Button */}
          <div className="mt-8 flex justify-center">
            <AuthButton />
          </div>

          {/* Footer Highlights */}
          <div className="mt-10 border-t border-purple-50 pt-6">
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                Row-Level Security Active
              </span>
              <span>•</span>
              <span>Role-Based Access</span>
              <span>•</span>
              <span>Real-Time Auditing</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}