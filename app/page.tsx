import AuthButton from "@/components/auth-button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-2xl text-center">
          {/* Logo */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-600 text-2xl font-bold text-white">
            M
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            MPA Hardware
          </h1>

          <p className="mt-3 text-base text-gray-500 sm:text-lg">
            Hardware Shop Management System
          </p>

          {/* Description */}
          <p className="mx-auto mt-6 max-w-lg text-sm leading-6 text-gray-600 sm:text-base">
            Manage your products, inventory, staff, sales and finances
            from one simple dashboard.
          </p>

          {/* Button */}
          <div className="mt-8 flex justify-center">
            <AuthButton />
          </div>

          {/* Footer text */}
          <p className="mt-10 text-xs text-gray-400">
            Secure management system
          </p>
        </div>
      </section>
    </main>
  );
}