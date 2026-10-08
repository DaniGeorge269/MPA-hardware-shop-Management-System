import { Suspense } from "react";
import MFAChallenge from "@/components/auth/mfa-challenge";

export default function MFAPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-gray-500">
            Loading...
          </p>
        </main>
      }
    >
      <MFAChallenge />
    </Suspense>
  );
}