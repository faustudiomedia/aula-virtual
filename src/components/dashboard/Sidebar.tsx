"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const adminNav: NavItem[] = [
  { label: "Panel", href: "/dashboard/admin", icon: "🏠" },
  { label: "Institutos", href: "/dashboard/admin/institutes", icon: "🏫" },
  { label: "Cursos", href: "/dashboard/admin/courses", icon: "📚" },
  { label: "Usuarios", href: "/dashboard/admin/users", icon: "👥" },
  { label: "Estadísticas", href: "/dashboard/admin/stats", icon: "📊" },
];

const teacherNav: NavItem[] = [
  { label: "Panel", href: "/dashboard/teacher", icon: "🏠" },
  { label: "Materiales", href: "/dashboard/teacher/materials", icon: "📁" },
  { label: "Alumnos", href: "/dashboard/teacher/students", icon: "👨‍🎓" },
];

const studentNav: NavItem[] = [
  { label: "Mi progreso", href: "/dashboard/student", icon: "🏠" },
  { label: "Catálogo", href: "/dashboard/student/courses", icon: "🔍" },
  { label: "Mi progreso", href: "/dashboard/student/progress", icon: "📈" },
];

interface SidebarProps {
  role: "admin" | "profesor" | "alumno";
  instituteName?: string;
  logoUrl?: string | null;
  primaryColor?: string;
  userName?: string;
}

export default function Sidebar({
  role,
  instituteName,
  logoUrl,
  primaryColor,
  userName,
}: SidebarProps) {
  const pathname = usePathname();
  const nav =
    role === "admin" ? adminNav : role === "profesor" ? teacherNav : studentNav;
  const color = primaryColor ?? "#1A56DB";

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-black/5 flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-black/5">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={instituteName ?? ""}
              width={32}
              height={32}
              className="w-8 h-8 rounded-lg object-cover"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ background: color }}
            >
              {instituteName?.charAt(0) ?? "M"}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-[#050F1F] leading-none">
              {instituteName ?? "MAVIC"}
            </p>
            <p className="text-xs text-[#050F1F]/40 mt-0.5">
              Plataforma Educativa
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard/admin" &&
              item.href !== "/dashboard/teacher" &&
              item.href !== "/dashboard/student" &&
              pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "text-white shadow-sm"
                  : "text-[#050F1F]/60 hover:bg-black/5 hover:text-[#050F1F]"
              }`}
              style={active ? { background: color } : undefined}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-black/5">
        {userName && (
          <p className="px-3 py-1 text-xs font-medium text-[#050F1F]/50 truncate">
            {userName}
          </p>
        )}
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-[#050F1F]/60 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <span>🚪</span>
            <span>Cerrar sesión</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
