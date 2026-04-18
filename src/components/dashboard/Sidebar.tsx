"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import {
  Globe,
  Building2,
  BookOpen,
  Users,
  BarChart2,
  LayoutDashboard,
  School,
  User,
  TrendingUp,
  PlusCircle,
  FolderOpen,
  GraduationCap,
  Calendar,
  Video,
  Mail,
  LogOut,
  BookMarked,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
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
  alumno:      "bg-blue-50 text-blue-600",
  profesor:    "bg-violet-50 text-violet-600",
  admin:       "bg-orange-50 text-orange-600",
  super_admin: "bg-red-50 text-red-600",
};

const superAdminSections: NavSection[] = [
  {
    title: "Super Admin",
    items: [
      { label: "Panel Global",       href: "/dashboard/super-admin",            icon: Globe },
      { label: "Institutos",         href: "/dashboard/super-admin/institutes", icon: Building2 },
      { label: "Cursos",             href: "/dashboard/super-admin/courses",    icon: BookOpen },
      { label: "Usuarios",           href: "/dashboard/super-admin/users",      icon: Users },
      { label: "Estadísticas",       href: "/dashboard/super-admin/stats",      icon: BarChart2 },
    ],
  },
  {
    title: "Vista Administrador",
    items: [
      { label: "Panel Admin",        href: "/dashboard/admin",                  icon: LayoutDashboard },
      { label: "Institutos",         href: "/dashboard/admin/institutes",       icon: School },
      { label: "Cursos",             href: "/dashboard/admin/courses",          icon: BookMarked },
      { label: "Usuarios",           href: "/dashboard/admin/users",            icon: User },
      { label: "Estadísticas",       href: "/dashboard/admin/stats",            icon: TrendingUp },
    ],
  },
  {
    title: "Vista Profesor",
    items: [
      { label: "Panel Profesor",     href: "/dashboard/teacher",                icon: LayoutDashboard },
      { label: "Nuevo curso",        href: "/dashboard/teacher/courses/new",    icon: PlusCircle },
      { label: "Materiales",         href: "/dashboard/teacher/materials",      icon: FolderOpen },
      { label: "Alumnos",            href: "/dashboard/teacher/students",       icon: GraduationCap },
    ],
  },
  {
    title: "Vista Alumno",
    items: [
      { label: "Panel Alumno",       href: "/dashboard/student",                icon: LayoutDashboard },
      { label: "Mis cursos",         href: "/dashboard/student/courses",        icon: BookOpen },
      { label: "Mi progreso",        href: "/dashboard/student/progress",       icon: TrendingUp },
    ],
  },
];

const adminSections: NavSection[] = [
  {
    items: [
      { label: "Panel",        href: "/dashboard/admin",            icon: LayoutDashboard },
      { label: "Institutos",   href: "/dashboard/admin/institutes", icon: School },
      { label: "Cursos",       href: "/dashboard/admin/courses",    icon: BookOpen },
      { label: "Usuarios",     href: "/dashboard/admin/users",      icon: Users },
      { label: "Estadísticas", href: "/dashboard/admin/stats",      icon: BarChart2 },
    ],
  },
];

const teacherSections: NavSection[] = [
  {
    items: [
      { label: "Panel",        href: "/dashboard/teacher",              icon: LayoutDashboard },
      { label: "Mis cursos",   href: "/dashboard/teacher/courses/new",  icon: BookOpen },
      { label: "Materiales",   href: "/dashboard/teacher/materials",    icon: FolderOpen },
      { label: "Alumnos",      href: "/dashboard/teacher/students",     icon: GraduationCap },
      { label: "Calendario",   href: "/dashboard/teacher/calendar",     icon: Calendar },
      { label: "Reuniones",    href: "/dashboard/meetings",             icon: Video },
      { label: "Mensajes",     href: "/dashboard/messages",             icon: Mail },
    ],
  },
];

const studentSections: NavSection[] = [
  {
    items: [
      { label: "Inicio",       href: "/dashboard/student",           icon: LayoutDashboard },
      { label: "Mis cursos",   href: "/dashboard/student/courses",   icon: BookOpen },
      { label: "Mi progreso",  href: "/dashboard/student/progress",  icon: TrendingUp },
      { label: "Calendario",   href: "/dashboard/student/calendar",  icon: Calendar },
      { label: "Reuniones",    href: "/dashboard/meetings",          icon: Video },
      { label: "Mensajes",     href: "/dashboard/messages",          icon: Mail },
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
  onClose?: () => void;
}

export default function Sidebar({
  role,
  instituteName,
  logoUrl,
  primaryColor,
  userName,
  avatarUrl,
  onClose,
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

  const initial = (userName || "U").charAt(0).toUpperCase();

  return (
    <aside className="w-64 h-full min-h-screen bg-white border-r border-black/5 flex flex-col">

      {/* Institute header */}
      <div className="p-4 border-b border-black/5">
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
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: color }}
            >
              {instituteName?.charAt(0) ?? "M"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#050F1F] leading-none truncate">
              {instituteName ?? "MAVIC"}
            </p>
            <p className="text-xs text-[#050F1F]/40 mt-0.5">Plataforma Educativa</p>
          </div>
          {/* Close button — only on mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg hover:bg-black/5 transition-colors text-[#050F1F]/50 flex-shrink-0"
              aria-label="Cerrar menú"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* User card */}
      <Link
        href="/dashboard/profile"
        onClick={onClose}
        className="mx-3 mt-3 p-3 rounded-xl flex items-center gap-3 hover:bg-black/5 transition-all group"
      >
        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: color }}
            >
              {initial}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#050F1F] truncate leading-none mb-1">
            {userName ?? "Usuario"}
          </p>
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
              roleBadgeClass[role] ?? "bg-black/5 text-[#050F1F]/50"
            }`}
          >
            {roleLabel[role] ?? role}
          </span>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto mt-1">
        {sections.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-5" : ""}>
            {section.title && (
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#050F1F]/30">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? "text-[#050F1F] bg-black/[0.04]"
                        : "text-[#050F1F]/55 hover:bg-black/[0.03] hover:text-[#050F1F]"
                    }`}
                  >
                    {active && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
                        style={{ background: color }}
                      />
                    )}
                    <Icon
                      size={16}
                      className="flex-shrink-0 transition-colors"
                      style={active ? { color } : undefined}
                    />
                    <span className={active ? "font-semibold" : ""}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer — logout */}
      <div className="p-3 border-t border-black/5">
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-[#050F1F]/50 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut size={16} className="flex-shrink-0" />
            <span>Cerrar sesión</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
