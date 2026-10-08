import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(
            ({ name, value, options }) => {
              response.cookies.set(name, value, options);
            }
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isDashboardRoute =
    pathname.startsWith("/dashboard");

  /*
   * Dashboard requires authentication.
   */
  if (isDashboardRoute && !user) {
    const loginUrl = request.nextUrl.clone();

    loginUrl.pathname = "/login";
    loginUrl.searchParams.set(
      "redirect",
      pathname
    );

    return NextResponse.redirect(loginUrl);
  }

  /*
   * Check MFA assurance level.
   */
  if (isDashboardRoute && user) {
    const {
      data: assurance,
      error,
    } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (!error) {
      const requiresMFA =
        assurance.nextLevel === "aal2" &&
        assurance.currentLevel !== "aal2";

      if (requiresMFA) {
        const mfaUrl = request.nextUrl.clone();

        mfaUrl.pathname = "/mfa";
        mfaUrl.searchParams.set(
          "redirect",
          pathname
        );

        return NextResponse.redirect(mfaUrl);
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};