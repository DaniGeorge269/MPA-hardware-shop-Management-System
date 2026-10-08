"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Truck,
  Wallet,
  Users,
  UserPlus,
  Settings,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Role = "ADMIN" | "STAFF" | "FINANCE";

const navigation = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "STAFF", "FINANCE"],
  },
  {
    name: "Products",
    href: "/dashboard/products",
    icon: Package,
    roles: ["ADMIN", "STAFF"],
  },
  {
    name: "Inventory",
    href: "/dashboard/inventory",
    icon: Boxes,
    roles: ["ADMIN", "STAFF"],
  },
  {
    name: "Sales",
    href: "/dashboard/sales",
    icon: ShoppingCart,
    roles: ["ADMIN", "STAFF", "FINANCE"],
  },
  {
    name: "Purchases",
    href: "/dashboard/purchases",
    icon: Truck,
    roles: ["ADMIN", "FINANCE"],
  },
  {
    name: "Finance",
    href: "/dashboard/finance",
    icon: Wallet,
    roles: ["ADMIN", "FINANCE"],
  },
  {
    name: "Staff",
    href: "/dashboard/staff",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    name: "Add Users",
    href: "/dashboard/users",
    icon: UserPlus,
    roles: ["ADMIN"],
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["ADMIN"],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const supabase = createClient();

  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    async function loadRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (data) {
        setRole(data.role as Role);
      }
    }

    loadRole();
  }, [supabase]);

  const visibleNavigation = navigation.filter((item) =>
    role ? item.roles.includes(role) : false
  );

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-purple-100 bg-white shadow-sm lg:flex">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-purple-100 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-sm font-bold text-white shadow-sm shadow-purple-600/30">
          M
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-gray-900">
            MPA Hardware
          </h1>
          <p className="text-[11px] font-medium text-purple-600/80">
            Management Portal
          </p>
        </div>
      </div>

      {/* Role Indicator */}
      {role && (
        <div className="px-5 pt-4">
          <div className="flex items-center justify-between rounded-xl border border-purple-100 bg-purple-50/60 px-3 py-2 text-xs">
            <span className="font-medium text-gray-500">Access Level</span>
            <span className="rounded-full bg-purple-200/60 px-2 py-0.5 text-[10px] font-bold tracking-wide text-purple-800">
              {role}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 p-4">
        {visibleNavigation.map((item) => {
          const Icon = item.icon;

          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition duration-150 ${
                active
                  ? "bg-purple-600 text-white shadow-sm shadow-purple-600/25"
                  : "text-gray-600 hover:bg-purple-50 hover:text-purple-900"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  active
                    ? "text-white"
                    : "text-gray-400 group-hover:text-purple-600"
                }`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="border-t border-purple-100 p-4">
        <div className="rounded-xl border border-purple-100/80 bg-purple-50/40 p-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-600" />
            <p className="text-xs font-semibold text-gray-900">
              MPA Hardware System
            </p>
          </div>
          <p className="mt-1 text-[11px] text-gray-500">
            Operational • v2.4
          </p>
        </div>
      </div>
    </aside>
  );
}