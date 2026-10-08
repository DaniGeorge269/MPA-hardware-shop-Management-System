"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type MFAFactor = {
  id: string;
  friendly_name?: string;
  status: "verified" | "unverified";
  created_at: string;
};

const supabase = createClient();

const MFA_FRIENDLY_NAME = "MPA Hardware Authenticator";

export default function MFASettings() {
  const [factor, setFactor] =
    useState<MFAFactor | null>(null);

  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadFactor() {
      const { data, error } =
        await supabase.auth.mfa.listFactors();

      if (cancelled) return;

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const verifiedFactor = data.totp.find(
        (item) => item.status === "verified"
      );

      if (verifiedFactor) {
        setFactor({
          id: verifiedFactor.id,
          friendly_name:
            verifiedFactor.friendly_name,
          status: "verified",
          created_at: verifiedFactor.created_at,
        });
      } else {
        setFactor(null);
      }

      setLoading(false);
    }

    void loadFactor();

    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshFactor() {
    const { data, error } =
      await supabase.auth.mfa.listFactors();

    if (error) {
      setError(error.message);
      return;
    }

    const verifiedFactor = data.totp.find(
      (item) => item.status === "verified"
    );

    if (verifiedFactor) {
      setFactor({
        id: verifiedFactor.id,
        friendly_name:
          verifiedFactor.friendly_name,
        status: "verified",
        created_at: verifiedFactor.created_at,
      });
    } else {
      setFactor(null);
    }
  }

  async function startEnrollment() {
    setError("");
    setSuccess("");
    setQrCode("");
    setSecret("");
    setCode("");

    const { data, error } =
      await supabase.auth.mfa.listFactors();

    if (error) {
      setError(error.message);
      return;
    }

    // Already enabled
    const verifiedFactor = data.totp.find(
      (item) => item.status === "verified"
    );

    if (verifiedFactor) {
      setFactor({
        id: verifiedFactor.id,
        friendly_name:
          verifiedFactor.friendly_name,
        status: "verified",
        created_at: verifiedFactor.created_at,
      });

      setError(
        "Two-factor authentication is already enabled for this account."
      );

      return;
    }

    // Existing pending enrollment
    const pendingFactor = data.all.find(
      (item) =>
        item.factor_type === "totp" &&
        item.status === "unverified" &&
        item.friendly_name === MFA_FRIENDLY_NAME
    );

    if (pendingFactor) {
      setError(
        "A pending MFA setup already exists. Please cancel the old setup in Supabase Authentication and start again."
      );

      return;
    }

    setEnrolling(true);

    const {
      data: enrollment,
      error: enrollError,
    } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: MFA_FRIENDLY_NAME,
    });

    if (enrollError) {
      setError(enrollError.message);
      setEnrolling(false);
      return;
    }

    setQrCode(enrollment.totp.qr_code);
    setSecret(enrollment.totp.secret);
  }

  async function verifyEnrollment() {
    if (code.length !== 6) {
      setError(
        "Enter the 6-digit code from your authenticator app."
      );
      return;
    }

    setError("");
    setSuccess("");
    setVerifying(true);

    const { data, error } =
      await supabase.auth.mfa.listFactors();

    if (error) {
      setError(error.message);
      setVerifying(false);
      return;
    }

    const unverifiedFactor = data.all.find(
      (item) =>
        item.factor_type === "totp" &&
        item.status === "unverified"
    );

    if (!unverifiedFactor) {
      setError("No pending MFA setup found.");
      setVerifying(false);
      return;
    }

    const challenge =
      await supabase.auth.mfa.challenge({
        factorId: unverifiedFactor.id,
      });

    if (challenge.error) {
      setError(challenge.error.message);
      setVerifying(false);
      return;
    }

    const verification =
      await supabase.auth.mfa.verify({
        factorId: unverifiedFactor.id,
        challengeId: challenge.data.id,
        code,
      });

    if (verification.error) {
      setError(verification.error.message);
      setVerifying(false);
      return;
    }

    setSuccess(
      "Two-factor authentication has been enabled successfully."
    );

    setQrCode("");
    setSecret("");
    setCode("");
    setEnrolling(false);
    setVerifying(false);

    await refreshFactor();
  }

  async function disableMFA() {
    if (!factor) return;

    const confirmed = window.confirm(
      "Are you sure you want to disable two-factor authentication?"
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    const { error } =
      await supabase.auth.mfa.unenroll({
        factorId: factor.id,
      });

    if (error) {
      setError(error.message);
      return;
    }

    setFactor(null);

    setSuccess(
      "Two-factor authentication has been disabled."
    );
  }

  function cancelEnrollment() {
    setEnrolling(false);
    setQrCode("");
    setSecret("");
    setCode("");
    setError("");
    setSuccess("");
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">
          Loading security settings...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* Header */}

        <div className="border-b border-gray-200 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-gray-900">
                Authenticator App
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Use an authenticator app to generate
                six-digit security codes.
              </p>
            </div>

            {factor ? (
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                Enabled
              </span>
            ) : (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                Disabled
              </span>
            )}
          </div>
        </div>

        {/* Content */}

        <div className="p-6">
          {/* Disabled */}

          {!factor && !enrolling && (
            <div>
              <p className="text-sm leading-6 text-gray-600">
                Protect your MPA Hardware account even if
                your password is compromised.
              </p>

              <button
                type="button"
                onClick={startEnrollment}
                className="mt-5 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700"
              >
                Set Up Authenticator
              </button>
            </div>
          )}

          {/* Enabled */}

          {factor && (
            <div>
              <div className="rounded-lg bg-green-50 p-4">
                <p className="font-medium text-green-800">
                  MFA is enabled
                </p>

                <p className="mt-1 text-sm text-green-700">
                  Your authenticator is connected to this
                  account.
                </p>
              </div>

              <button
                type="button"
                onClick={disableMFA}
                className="mt-5 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                Disable MFA
              </button>
            </div>
          )}

          {/* Enrollment */}

          {enrolling && (
            <div className="space-y-6">
              {/* Step 1 */}

              <div>
                <h3 className="font-semibold text-gray-900">
                  Step 1 — Scan the QR Code
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Open Google Authenticator or another
                  authenticator app and scan this QR code.
                </p>
              </div>

              {/* QR Code */}

              {qrCode && (
                <div className="flex justify-center rounded-lg border border-gray-200 bg-white p-6">
                  {/* Supabase returns the QR code as SVG markup. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(
                      qrCode
                    )}`}
                    alt="MFA QR Code"
                    width={208}
                    height={208}
                    className="h-52 w-52"
                  />
                </div>
              )}

              {/* Secret */}

              <div>
                <p className="text-xs font-medium text-gray-500">
                  Cannot scan the QR code?
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Enter this setup key manually in your
                  authenticator app.
                </p>

                <div className="mt-2 break-all rounded-lg bg-gray-100 p-3 font-mono text-xs text-gray-700">
                  {secret}
                </div>
              </div>

              {/* Step 2 */}

              <div>
                <label
                  htmlFor="mfa-code"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Step 2 — Enter verification code
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
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-xl tracking-[0.4em] outline-none transition focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
              </div>

              {/* Buttons */}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={verifyEnrollment}
                  disabled={
                    verifying || code.length !== 6
                  }
                  className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {verifying
                    ? "Verifying..."
                    : "Verify & Enable"}
                </button>

                <button
                  type="button"
                  onClick={cancelEnrollment}
                  disabled={verifying}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Error */}

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Success */}

          {success && (
            <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}