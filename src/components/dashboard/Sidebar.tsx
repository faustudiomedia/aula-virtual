"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import {
  Globe, Building2, BookOpen, Users, BarChart2, LayoutDashboard, School,
  User, TrendingUp, PlusCircle, FolderOpen, GraduationCap, Calendar, Video,
  Mail, LogOut, BookMarked, X, CalendarDays, Bell, ClipboardList, Award,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AgorifyLogo } from "@/components/ui/AgorifyLogo";

interface NavItem   { label: string; href: string; icon: LucideIcon; }
interface NavSection { title?: string; items: NavItem[]; }

const EXACT_MATCH_HREFS = new Set([
  "/dashboard/admin", "/dashboard/teacher", "/dashboard/student", "/dashboard/super-admin",
]);

const roleLabel: Record<string, string> = {
  alumno: "Alumno", profesor: "Profesor", admin: "Administrador", super_admin: "Super Admin",
};

const roleBadgeStyle: Record<string, string> = {
  alumno:      "bg-sky-500/20 text-sky-200",
  profesor:    "bg-violet-400/20 text-violet-200",
  admin:       "bg-amber-400/20 text-amber-200",
  super_admin: "bg-rose-400/20 text-rose-200",
};

const superAdminSections: NavSection[] = [
  {
    title: "Super Admin",
    items: [
      { label: "Panel Global",   href: "/dashboard/super-admin",            icon: Globe },
      { label: "Institutos",     href: "/dashboard/super-admin/institutes", icon: Building2 },
      { label: "Cursos",         href: "/dashboard/super-admin/courses",    icon: BookOpen },
      { label: "Usuarios",       href: "/dashboard/super-admin/users",      icon: Users },
      { label: "Estadísticas",   href: "/dashboard/super-admin/stats",      icon: BarChart2 },
    ],
  },
  {
    title: "Vista Administrador",
    items: [
      { label: "Panel Admin",    href: "/dashboard/admin",                  icon: LayoutDashboard },
      { label: "Institutos",     href: "/dashboard/admin/institutes",       icon: School },
      { label: "Cursos",         href: "/dashboard/admin/courses",          icon: BookMarked },
      { label: "Usuarios",       href: "/dashboard/admin/users",            icon: User },
      { label: "Estadísticas",   href: "/dashboard/admin/stats",            icon: TrendingUp },
      { label: "Certificados",   href: "/dashboard/admin/certificates",     icon: Award },
    ],
  },
  {
    title: "Vista Profesor",
    items: [
      { label: "Panel Profesor", href: "/dashboard/teacher",                icon: LayoutDashboard },
      { label: "Nuevo curso",    href: "/dashboard/teacher/courses/new",    icon: PlusCircle },
      { label: "Materiales",     href: "/dashboard/teacher/materials",      icon: FolderOpen },
      { label: "Alumnos",        href: "/dashboard/teacher/students",       icon: GraduationCap },
      { label: "Certificados",   href: "/dashboard/teacher/certificates",   icon: Award },
    ],
  },
  {
    title: "Vista Alumno",
    items: [
      { label: "Panel Alumno",   href: "/dashboard/student",                icon: LayoutDashboard },
      { label: "Mis cursos",     href: "/dashboard/student/courses",        icon: BookOpen },
      { label: "Mi progreso",    href: "/dashboard/student/progress",       icon: TrendingUp },
    ],
  },
  {
    title: "Comunicación",
    items: [
      { label: "Reuniones",      href: "/dashboard/meetings",               icon: Video },
      { label: "Mensajes",       href: "/dashboard/messages",               icon: Mail },
    ],
  },
];

const adminSections: NavSection[] = [{
  items: [
    { label: "Panel",               href: "/dashboard/admin",               icon: LayoutDashboard },
    { label: "Institutos",          href: "/dashboard/admin/institutes",    icon: School },
    { label: "Cursos",              href: "/dashboard/admin/courses",       icon: BookOpen },
    { label: "Usuarios",            href: "/dashboard/admin/users",         icon: Users },
    { label: "Periodos Académicos", href: "/dashboard/admin/academic-periods", icon: CalendarDays },
    { label: "Estadísticas",        href: "/dashboard/admin/stats",         icon: BarChart2 },
    { label: "Auditoría",           href: "/dashboard/admin/audit",         icon: ClipboardList },
    { label: "Invitaciones",        href: "/dashboard/admin/invitations",   icon: Bell },
    { label: "Certificados",        href: "/dashboard/admin/certificates",  icon: Award },
  ],
}];

const teacherSections: NavSection[] = [{
  items: [
    { label: "Panel",          href: "/dashboard/teacher",                  icon: LayoutDashboard },
    { label: "Mis cursos",     href: "/dashboard/teacher/courses",          icon: BookOpen },
    { label: "Materiales",     href: "/dashboard/teacher/materials",        icon: FolderOpen },
    { label: "Alumnos",        href: "/dashboard/teacher/students",         icon: GraduationCap },
    { label: "Certificados",   href: "/dashboard/teacher/certificates",     icon: Award },
    { label: "Calendario",     href: "/dashboard/teacher/calendar",         icon: Calendar },
    { label: "Reuniones",      href: "/dashboard/meetings",                 icon: Video },
    { label: "Mensajes",       href: "/dashboard/messages",                 icon: Mail },
  ],
}];

const studentSections: NavSection[] = [{
  items: [
    { label: "Inicio",         href: "/dashboard/student",                  icon: LayoutDashboard },
    { label: "Mis cursos",     href: "/dashboard/student/courses",          icon: BookOpen },
    { label: "Mi progreso",    href: "/dashboard/student/progress",         icon: TrendingUp },
    { label: "Calendario",     href: "/dashboard/student/calendar",         icon: Calendar },
    { label: "Reuniones",      href: "/dashboard/meetings",                 icon: Video },
    { label: "Mensajes",       href: "/dashboard/messages",                 icon: Mail },
  ],
}];

interface SidebarProps {
  role: "admin" | "profesor" | "alumno" | "super_admin";
  instituteName?: string;
  logoUrl?: string | null;
  primaryColor?: string;
  userName?: string;
  avatarUrl?: string | null;
  onClose?: () => void;
}

export default function Sidebar({ role, instituteName, logoUrl, primaryColor, userName, avatarUrl, onClose }: SidebarProps) {
  const pathname = usePathname();
  const sections =
    role === "super_admin" ? superAdminSections :
    role === "admin"       ? adminSections :
    role === "profesor"    ? teacherSections :
    studentSections;

  function isActive(href: string) {
    if (pathname === href) return true;
    if (EXACT_MATCH_HREFS.has(href)) return false;
    return pathname.startsWith(href);
  }

  const initial = (userName || "U").charAt(0).toUpperCase();

  return (
    <aside className="w-64 h-full min-h-screen flex flex-col"
      style={{ background: "var(--ag-sidebar-bg)" }}>

      {/* Brand header */}
      <div className="p-4" style={{ borderBottom: "1px solid var(--ag-sidebar-border)" }}>
        <div className="flex items-center justify-between">
          <AgorifyLogo size={34} variant="full" theme="light" showSub />
          {onClose && (
            <button onClick={onClose}
              className="md:hidden p-1.5 rounded-lg transition-colors flex-shrink-0"
              style={{ color: "var(--ag-sidebar-muted)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--ag-sidebar-hover)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              aria-label="Cerrar menú">
              <X size={18} />
            </button>
          )}
        </div>
        {instituteName && (
          <p className="text-xs mt-2 truncate" style={{ color: "var(--ag-sidebar-muted)" }}>
            {instituteName}
          </p>
        )}
      </div>

      {/* User card */}
      <Link href="/dashboard/profile" onClick={onClose}
        className="mx-3 mt-3 p-3 rounded-xl flex items-center gap-3 transition-all"
        style={{ border: "1px solid var(--ag-sidebar-border)" }}
        onMouseEnter={e => (e.currentTarget.style.background = "var(--ag-sidebar-hover)")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: "rgba(255,255,255,0.2)" }}>
              {initial}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate leading-none mb-1.5"
            style={{ color: "var(--ag-sidebar-text)" }}>
            {userName ?? "Usuario"}
          </p>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${roleBadgeStyle[role] ?? "bg-white/10 text-white/50"}`}>
            {roleLabel[role] ?? role}
          </span>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto mt-2 ag-sidebar-scroll">
        {sections.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-6" : ""}>
            {section.title && (
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--ag-sidebar-muted)" }}>
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} onClick={onClose}
                    className="relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      color: active ? "white" : "var(--ag-sidebar-muted)",
                      background: active ? "var(--ag-sidebar-active)" : "transparent",
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "var(--ag-sidebar-hover)"; e.currentTarget.style.color = "var(--ag-sidebar-text)"; }}}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--ag-sidebar-muted)"; }}}>
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-white opacity-60" />
                    )}
                    <Icon size={16} className="flex-shrink-0" />
                    <span className={active ? "font-semibold" : ""}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3" style={{ borderTop: "1px solid var(--ag-sidebar-border)" }}>
        <form action={logout}>
          <button type="submit"
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ color: "var(--ag-sidebar-muted)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; e.currentTarget.style.color = "#FCA5A5"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--ag-sidebar-muted)"; }}>
            <LogOut size={16} className="flex-shrink-0" />
            <span>Cerrar sesión</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
