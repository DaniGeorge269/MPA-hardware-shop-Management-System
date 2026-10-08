"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    /*
     * Check the user's MFA assurance level.
     *
     * AAL1 = Password authentication
     * AAL2 = Password + MFA
     */
    const {
      data: assurance,
      error: assuranceError,
    } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (assuranceError) {
      setError(assuranceError.message);
      setLoading(false);
      return;
    }

    /*
     * If MFA is enabled for this account,
     * send the user to the MFA verification page.
     */
    if (
      assurance.nextLevel === "aal2" &&
      assurance.currentLevel !== "aal2"
    ) {
      router.push(
        `/mfa?redirect=${encodeURIComponent(
          "/dashboard"
        )}`
      );

      return;
    }

    /*
     * No MFA required.
     */
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-purple-50/40 px-4 py-12">
      {/* Brand Background Ambient Glows */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-40 h-120 w-120 rounded-full bg-purple-300/25 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-40 h-120 w-120 rounded-full bg-purple-400/20 blur-3xl"
      />

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-purple-100 bg-white/95 p-8 shadow-xl shadow-purple-900/5 backdrop-blur-xl sm:p-10">
          {/* Logo & Header */}

          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600 text-2xl font-bold text-white shadow-lg shadow-purple-600/30 ring-4 ring-purple-100">
              H
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-0.5 text-xs font-semibold text-purple-700">
              Business Portal
            </div>

            <h1 className="mt-3 text-2xl font-black tracking-tight text-gray-950 sm:text-3xl">
              Hardware Shop
            </h1>

            <p className="mt-1.5 text-xs text-gray-500">
              Management Dashboard
            </p>
          </div>

          {/* Login Form */}

          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >
            {/* Email */}

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-purple-950"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter your email"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-purple-200/80 bg-purple-50/20 px-4 py-3 text-sm text-gray-900 outline-none transition duration-200 placeholder:text-gray-400 focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-500/15"
              />
            </div>

            {/* Password */}

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-purple-950"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-purple-200/80 bg-purple-50/20 px-4 py-3 text-sm text-gray-900 outline-none transition duration-200 placeholder:text-gray-400 focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-500/15"
              />
            </div>

            {/* Error */}

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-xs font-medium text-rose-700">
                {error}
              </div>
            )}

            {/* Button */}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-purple-600 py-3.5 text-sm font-bold text-white shadow-md shadow-purple-600/30 transition duration-200 hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-600/40 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Footer */}

          <p className="mt-8 text-center text-xs text-gray-400">
            Authorized staff only
          </p>
        </div>
      </div>
    </main>
  );
}