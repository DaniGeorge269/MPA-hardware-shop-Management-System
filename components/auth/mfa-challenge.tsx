"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function MFAChallenge() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo =
    searchParams.get("redirect") || "/dashboard";

  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data, error } =
        await supabase.auth.mfa.listFactors();

      if (cancelled) return;

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const factor = data.totp.find(
        (item) => item.status === "verified"
      );

      if (!factor) {
        router.replace("/dashboard");
        return;
      }

      const challenge =
        await supabase.auth.mfa.challenge({
          factorId: factor.id,
        });

      if (cancelled) return;

      if (challenge.error) {
        setError(challenge.error.message);
        setLoading(false);
        return;
      }

      setFactorId(factor.id);
      setChallengeId(challenge.data.id);
      setLoading(false);
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function verifyCode(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (code.length !== 6) {
      setError("Enter the 6-digit authenticator code.");
      return;
    }

    setError("");
    setVerifying(true);

    const { error } =
      await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });

    if (error) {
      setError(error.message);
      setVerifying(false);
      return;
    }

    router.replace(redirectTo);
    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            Preparing two-factor authentication...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <span className="text-2xl">🔐</span>
            </div>

            <h1 className="mt-5 text-2xl font-bold text-gray-900">
              Two-Factor Authentication
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Enter the 6-digit code from your
              authenticator app to continue.
            </p>
          </div>

          <form
            onSubmit={verifyCode}
            className="mt-8 space-y-5"
          >
            <div>
              <label
                htmlFor="mfa-code"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Authentication Code
              </label>

              <input
                id="mfa-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
                value={code}
                onChange={(event) =>
                  setCode(
                    event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6)
                  )
                }
                placeholder="000000"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl tracking-[0.4em] outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={
                verifying || code.length !== 6
              }
              className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {verifying
                ? "Verifying..."
                : "Verify & Continue"}
            </button>

            <button
              type="button"
              onClick={() => router.replace("/login")}
              className="w-full text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}