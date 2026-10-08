"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  full_name: string | null;
  email: string | null;
  role: "ADMIN" | "STAFF" | "FINANCE";
};

export default function UserHeader() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setUser(user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, email, role")
        .eq("id", user.id)
        .single();

      setProfile(profileData);
      setLoading(false);
    }

    loadUser();
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="h-9 w-32 animate-pulse rounded-xl border border-purple-100 bg-purple-50/60" />
    );
  }

  if (!user) {
    return null;
  }

  const name = profile?.full_name || "User";
  const role = profile?.role || "STAFF";

  return (
    <div className="flex items-center gap-3">
      {/* User Information */}
      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold tracking-tight text-gray-900">
          {name}
        </p>

        <p className="text-[11px] font-semibold uppercase tracking-wider text-purple-600">
          {role}
        </p>
      </div>

      {/* Avatar Pill */}
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-200/80 bg-purple-100 text-sm font-bold text-purple-700 shadow-sm shadow-purple-200/50">
        {name.charAt(0).toUpperCase()}
      </div>

      {/* Logout Action */}
      <button
        type="button"
        onClick={handleLogout}
        className="group flex items-center gap-2 rounded-xl border border-purple-100 bg-white px-3 py-2 text-xs font-semibold text-gray-600 shadow-sm transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 active:scale-[0.98]"
      >
        <LogOut className="h-3.5 w-3.5 text-gray-400 transition-colors group-hover:text-purple-600" />

        <span className="hidden sm:inline">Logout</span>
      </button>
    </div>
  );
}