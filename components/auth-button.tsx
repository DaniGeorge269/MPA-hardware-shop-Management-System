"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
      setLoading(false);
    }

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  if (loading) {
    return (
      <div className="h-11 w-36 animate-pulse rounded-xl border border-purple-100 bg-purple-50/60" />
    );
  }

  if (user) {
    return (
      <Link
        href="/dashboard"
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-purple-600/30 transition duration-200 hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-600/40 active:scale-[0.98]"
      >
        <span>Open Dashboard</span>
        <span aria-hidden="true">→</span>
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-purple-600/30 transition duration-200 hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-600/40 active:scale-[0.98]"
    >
      <span>Sign In</span>
      <span aria-hidden="true">→</span>
    </Link>
  );
}