import { ReactNode } from "react";
import Sidebar from "@/components/dashboard/sidebar";
import MobileSidebar from "@/components/dashboard/mobile-sidebar";
import UserHeader from "@/components/dashboard/user-header";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <MobileSidebar />

              <div>
                <h2 className="font-semibold text-gray-900">
                  Dashboard
                </h2>

                <p className="hidden text-xs text-gray-400 sm:block">
                  MPA Hardware Management
                </p>
              </div>
            </div>

            <UserHeader />
          </header>

          {/* Page */}
          <main className="flex-1 p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}