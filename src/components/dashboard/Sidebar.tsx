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

interface NavSection {
  title?: string;
  items: NavItem[];
}

// Root hrefs that should only be active on exact match (not prefix)
const EXACT_MATCH_HREFS = new Set([
  "/dashboard/admin",
  "/dashboard/teacher",
  "/dashboard/student",
  "/dashboard/super-admin",
]);

const superAdminSections: NavSection[] = [
  {
    title: "Super Admin",
    items: [
      { label: "Panel Global",       href: "/dashboard/super-admin",            icon: "🌐" },
      { label: "Institutos",         href: "/dashboard/super-admin/institutes", icon: "🏛️" },
      { label: "Cursos",             href: "/dashboard/super-admin/courses",    icon: "📚" },
      { label: "Usuarios",           href: "/dashboard/super-admin/users",      icon: "👥" },
      { label: "Estadísticas",       href: "/dashboard/super-admin/stats",      icon: "📊" },
    ],
  },
  {
    title: "Vista Administrador",
    items: [
      { label: "Panel Admin",        href: "/dashboard/admin",                  icon: "🏠" },
      { label: "Institutos",         href: "/dashboard/admin/institutes",       icon: "🏫" },
      { label: "Cursos",             href: "/dashboard/admin/courses",          icon: "📖" },
      { label: "Usuarios",           href: "/dashboard/admin/users",            icon: "👤" },
      { label: "Estadísticas",       href: "/dashboard/admin/stats",            icon: "📈" },
    ],
  },
  {
    title: "Vista Profesor",
    items: [
      { label: "Panel Profesor",     href: "/dashboard/teacher",                icon: "🏠" },
      { label: "Nuevo curso",        href: "/dashboard/teacher/courses/new",    icon: "➕" },
      { label: "Materiales",         href: "/dashboard/teacher/materials",      icon: "📁" },
      { label: "Alumnos",            href: "/dashboard/teacher/students",       icon: "👨‍🎓" },
    ],
  },
  {
    title: "Vista Alumno",
    items: [
      { label: "Panel Alumno",       href: "/dashboard/student",                icon: "🏠" },
      { label: "Catálogo",           href: "/dashboard/student/courses",        icon: "🔍" },
      { label: "Mi progreso",        href: "/dashboard/student/progress",       icon: "📈" },
    ],
  },
];

const adminSections: NavSection[] = [
  {
    items: [
      { label: "Panel",        href: "/dashboard/admin",            icon: "🏠" },
      { label: "Institutos",   href: "/dashboard/admin/institutes", icon: "🏫" },
      { label: "Cursos",       href: "/dashboard/admin/courses",    icon: "📚" },
      { label: "Usuarios",     href: "/dashboard/admin/users",      icon: "👥" },
      { label: "Estadísticas", href: "/dashboard/admin/stats",      icon: "📊" },
    ],
  },
];

const teacherSections: NavSection[] = [
  {
    items: [
      { label: "Panel",      href: "/dashboard/teacher",                 icon: "🏠" },
      { label: "Mis cursos", href: "/dashboard/teacher/courses/new",     icon: "📚" },
      { label: "Materiales", href: "/dashboard/teacher/materials",       icon: "📁" },
      { label: "Alumnos",    href: "/dashboard/teacher/students",        icon: "👨‍🎓" },
    ],
  },
];

const studentSections: NavSection[] = [
  {
    items: [
      { label: "Inicio",      href: "/dashboard/student",          icon: "🏠" },
      { label: "Catálogo",    href: "/dashboard/student/courses",  icon: "🔍" },
      { label: "Mi progreso", href: "/dashboard/student/progress", icon: "📈" },
    ],
  },
];

interface SidebarProps {
  role: "admin" | "profesor" | "alumno" | "super_admin";
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
  const sections =
    role === "super_admin" ? superAdminSections :
    role === "admin"       ? adminSections :
    role === "profesor"    ? teacherSections :
    studentSections;
  const color = primaryColor ?? "#1A56DB";

  function isActive(href: string) {
    if (pathname === href) return true;
    if (EXACT_MATCH_HREFS.has(href)) return false;
    return pathname.startsWith(href);
  }

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
      <nav className="flex-1 p-3 overflow-y-auto">
        {sections.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-4" : ""}>
            {section.title && (
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#050F1F]/30">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
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
            </div>
          </div>
        ))}
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
