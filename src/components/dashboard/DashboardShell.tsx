"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
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
  role, instituteName, userName, primaryColor, logoUrl, avatarUrl, userId, children,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen" style={{ background: "var(--ag-bg)" }}>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={[
        "fixed inset-y-0 left-0 z-50 transition-transform duration-300",
        "md:static md:translate-x-0 md:z-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
      ].join(" ")}>
        <Sidebar
          role={role} instituteName={instituteName} userName={userName}
          primaryColor={primaryColor} logoUrl={logoUrl} avatarUrl={avatarUrl}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Right side */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header
          className="sticky top-0 z-30 flex items-center gap-3 px-4 h-14 backdrop-blur-md border-b shadow-sm"
          style={{
            background: "var(--ag-topbar-bg, rgba(255,255,255,0.88))",
            borderColor: "var(--ag-border-light)",
          }}
        >
          <button onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-xl hover:bg-[var(--ag-surface-alt)] transition-colors"
            style={{ color: "var(--ag-text-muted)" }}
            aria-label="Abrir menú">
            <Menu size={20} />
          </button>

          {/* Mobile institute name */}
          <span className="font-semibold text-sm truncate fle
