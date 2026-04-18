"use client";

import { useEffect, useState } from "react";
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

const EXACT_MATCH_HREFS = new Set([
  "/dashboard/admin",
  "/dashboard/teacher",
  "/dashboard/student",
  "/dashboard/super-admin",
]);

const roleLabel: Record<string, string> = {
  alumno: "Alumno",
  profesor: "Profesor",
  admin: "Administrador",
  super_admin: "Super Admin",
};

const roleBadgeClass: Record<string, string> = {
  alumno:     "bg-blue-50 text-blue-600",
  profesor:   "bg-violet-50 text-violet-600",
  admin:      "bg-orange-50 text-orange-600",
  super_admin:"bg-red-50 text-red-600",
};

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
      { label: "Mis cursos",         href: "/dashboard/student/courses",        icon: "📚" },
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
      { label: "Panel",        href: "/dashboard/teacher",              icon: "🏠" },
      { label: "Mis cursos",   href: "/dashboard/teacher/courses/new",  icon: "📚" },
      { label: "Materiales",   href: "/dashboard/teacher/materials",    icon: "📁" },
      { label: "Alumnos",      href: "/dashboard/teacher/students",     icon: "👨‍🎓" },
      { label: "Calendario",   href: "/dashboard/teacher/calendar",     icon: "📅" },
      { label: "Reuniones",    href: "/dashboard/meetings",             icon: "🎥" },
      { label: "Mensajes",     href: "/dashboard/messages",             icon: "✉️" },
    ],
  },
];

const studentSections: NavSection[] = [
  {
    items: [
      { label: "Inicio",       href: "/dashboard/student",           icon: "🏠" },
      { label: "Mis cursos",   href: "/dashboard/student/courses",   icon: "📚" },
      { label: "Mi progreso",  href: "/dashboard/student/progress",  icon: "📈" },
      { label: "Calendario",   href: "/dashboard/student/calendar",  icon: "📅" },
      { label: "Reuniones",    href: "/dashboard/meetings",          icon: "🎥" },
      { label: "Mensajes",     href: "/dashboard/messages",          icon: "✉️" },
    ],
  },
];

interface SidebarProps {
  role: "admin" | "profesor" | "alumno" | "super_admin";
  instituteName?: string;
  logoUrl?: string | null;
  primaryColor?: string;
  userName?: string;
  avatarUrl?: string | null;
}

export default function Sidebar({
  role,
  instituteName,
  logoUrl,
  primaryColor,
  userName,
  avatarUrl,
}: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on navigation
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

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

  const initial = (userName || "U").charAt(0).toUpperCase();

  const instituteHeader = (
    <div className="p-4 border-b border-black/5 flex items-center gap-3">
      {logoUrl ? (
        <Image src={logoUrl} alt={instituteName ?? ""} width={32} height={32} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: color }}>
          {instituteName?.charAt(0) ?? "M"}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#050F1F] truncate leading-none">{instituteName ?? "MAVIC"}</p>
        <p className="text-xs text-[#050F1F]/40 mt-0.5">Plataforma Educativa</p>
      </div>
    </div>
  );

  const userCard = (
    <Link href="/dashboard/profile" className="mx-3 mt-3 p-3 rounded-xl flex items-center gap-3 hover:bg-black/5 transition-all">
      <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold" style={{ background: color }}>
            {initial}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#050F1F] truncate leading-none mb-1">{userName ?? "Usuario"}</p>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${roleBadgeClass[role] ?? "bg-black/5 text-[#050F1F]/50"}`}>
          {roleLabel[role] ?? role}
        </span>
      </div>
    </Link>
  );

  const nav = (
    <nav className="flex-1 p-3 overflow-y-auto mt-1">
      {sections.map((section, si) => (
        <div key={si} className={si > 0 ? "mt-5" : ""}>
          {section.title && (
            <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#050F1F]/30 mb-0.5">
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
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    active
                      ? "text-white shadow-sm"
                      : "text-[#050F1F]/60 hover:bg-black/5 hover:text-[#050F1F]"
                  }`}
                  style={active ? { background: color } : undefined}
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="p-3 border-t border-black/5">
      <form action={logout}>
        <button
          type="submit"
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-[#050F1F]/60 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <span>🚪</span>
          <span>Cerrar sesión</span>
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* ── Mobile top bar ──────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-black/5 flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[#050F1F]/50 hover:bg-black/5 transition-all"
          aria-label="Abrir menú"
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
            <rect width="18" height="2" rx="1" fill="currentColor"/>
            <rect y="6" width="12" height="2" rx="1" fill="currentColor"/>
            <rect y="12" width="18" height="2" rx="1" fill="currentColor"/>
          </svg>
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          {logoUrl ? (
            <Image src={logoUrl} alt={instituteName ?? ""} width={24} height={24} className="w-6 h-6 rounded-md object-cover flex-shrink-0" />
          ) : (
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: color }}>
              {instituteName?.charAt(0) ?? "M"}
            </div>
          )}
          <span className="text-sm font-semibold text-[#050F1F] truncate">{instituteName ?? "MAVIC"}</span>
        </div>

        <Link href="/dashboard/profile" className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold" style={{ background: color }}>
              {initial}
            </div>
          )}
        </Link>
      </header>

      {/* ── Mobile backdrop ──────────────────────────────────── */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 lg:w-64 min-h-screen bg-white border-r border-black/5 flex flex-col
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Close button — mobile only */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center text-[#050F1F]/40 hover:bg-black/5 transition-all z-10"
          aria-label="Cerrar menú"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>

        {instituteHeader}
        {userCard}
        {nav}
        {footer}
      </aside>
    </>
  );
}
