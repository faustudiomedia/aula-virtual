"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import { NotificationBell } from "@/components/ui/NotificationBell";
import type { UserRole } from "@/lib/types";

interface Props {
  role: UserRole;
  instituteName: string;
  userName: string;
  primaryColor: string;
  logoUrl: string | null;
  avatarUrl: string | null;
  userId: string;
  children: React.ReactNode;
}

export default function DashboardShell({
  role,
  instituteName,
  userName,
  primaryColor,
  logoUrl,
  avatarUrl,
  userId,
  children,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F0F9FF]">

      {/* ── Mobile backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      {/* Desktop: static in the flex flow. Mobile: fixed drawer */}
      <div
        className={[
          "fixed inset-y-0 left-0 z-50 transition-transform duration-300",
          "md:static md:translate-x-0 md:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <Sidebar
          role={role}
          instituteName={instituteName}
          userName={userName}
          primaryColor={primaryColor}
          logoUrl={logoUrl}
          avatarUrl={avatarUrl}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* ── Right side: top bar + main ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar — mobile + desktop */}
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 h-14 bg-white border-b border-black/5 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-xl hover:bg-black/5 transition-colors text-[#050F1F]/70"
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>
          <span className="font-semibold text-[#050F1F] text-sm truncate flex-1 md:hidden">
            {instituteName}
          </span>
          <div className="hidden md:block flex-1" />
          <NotificationBell userId={userId} />
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
