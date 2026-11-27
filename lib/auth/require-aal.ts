import type { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * True when the user has a verified 2FA factor but this session has
 * not completed the code step (still AAL1).
 *
 * Fails closed: if the assurance level can't be read, treat the
 * session as not verified.
 */
export async function mfaPending(
  supabase: ServerClient
): Promise<boolean> {
  const { data, error } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (error || !data) {
    return true;
  }

  return (
    data.nextLevel === "aal2" &&
    data.currentLevel !== "aal2"
  );
}
