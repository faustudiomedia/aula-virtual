import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Institute, UserRole } from "@/lib/types";
import { getDashboardPath } from "@/lib/auth/getDashboardPath";
import {
  Building2, GraduationCap, UserCog, BookOpen,
  Globe, Users, ArrowRight, Plus,
} from "lucide-react";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin"))
    redirect(getDashboardPath(profile?.role ?? "alumno"));

  const { data: institutes } = await supabase
    .from("institutes")
    .select("*")
    .order("created_at", { ascending: false });

  const instituteList = (institutes ?? []) as Institute[];

  // Stats per institute
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("institute_id, role");

  const profilesByInstitute: Record<string, { students: number; teachers: number }> = {};
  (allProfiles ?? []).forEach((p: { institute_id: string | null; role: UserRole }) => {
    if (!p.institute_id) return;
    const entry = profilesByInstitute[p.institute_id] ?? { students: 0, teachers: 0 };
    if (p.role === "alumno") entry.students++;
    if (p.role === "profesor") entry.teachers++;
    profilesByInstitute[p.institute_id] = entry;
  });

  const { data: allCourses } = await supabase
    .from("courses")
    .select("institute_id");

  const coursesByInstitute: Record<string, number> = {};
  (allCourses ?? []).forEach((c: { institute_id: string }) => {
    coursesByInstitute[c.institute_id] = (coursesByInstitute[c.institute_id] ?? 0) + 1;
  });

  const totalStudents = Object.values(profilesByInstitute).reduce((s, p) => s + p.students, 0);
  const totalTeachers = Object.values(profilesByInstitute).reduce((s, p) => s + p.teachers, 0);
  const totalCourses  = Object.values(coursesByInstitute).reduce((s, n) => s + n, 0);

  const stats = [
    {
      label: "Institutos",
      value: instituteList.length,
      sub: "activos en la plataforma",
      Icon: Building2,
      href: "/dashboard/admin/institutes",
      color: "var(--ag-navy)",
      bg: "rgba(30,58,95,0.08)",
      border: "rgba(30,58,95,0.14)",
    },
    {
      label: "Alumnos",
      value: totalStudents,
      sub: "registrados",
      Icon: GraduationCap,
      href: "/dashboard/admin/users?role=alumno",
      color: "#059669",
      bg: "rgba(5,150,105,0.08)",
      border: "rgba(5,150,105,0.14)",
    },
    {
      label: "Profesores",
      value: totalTeachers,
      sub: "activos",
      Icon: UserCog,
      href: "/dashboard/admin/users?role=profesor",
      color: "#7C3AED",
      bg: "rgba(124,58,237,0.08)",
      border: "rgba(124,58,237,0.14)",
    },
    {
      label: "Cursos",
      value: totalCourses,
      sub: "creados",
      Icon: BookOpen,
      href: "/dashboard/admin/courses",
      color: "#D97706",
      bg: "rgba(217,119,6,0.08)",
      border: "rgba(217,119,6,0.14)",
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ag-text)]">Panel de Administración</h1>
          <p className="text-[var(--ag-text-muted)] mt-1 text-sm">
            Bienvenido,{" "}
            <span className="font-medium text-[var(--ag-text)]">
              {profile?.full_name ?? "Admin"}
            </span>{" "}
            — Gestión global de institutos y usuarios
          </p>
        </div>
        <Link
          href="/dashboard/admin/institutes/new"
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition shrink-0"
          style={{ background: "var(--ag-navy)" }}
        >
          <Plus size={15} /> Nuevo instituto
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-2xl p-5 border transition-all hover:-translate-y-0.5 hover:shadow-md"
            style={{ background: s.bg, borderColor: s.border }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(4px)" }}
            >
              <s.Icon size={20} style={{ color: s.color }} />
            </div>
            <p className="text-3xl font-bold text-[var(--ag-text)] mb-1 tabular-nums">
              {s.value.toLocaleString()}
            </p>
            <p className="text-sm font-semibold" style={{ color: s.color }}>{s.label}</p>
            <p className="text-xs text-[var(--ag-text-muted)] mt-0.5">{s.sub}</p>
            <div
              className="flex items-center gap-1 mt-3 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: s.color }}
            >
              Ver detalle <ArrowRight size={11} />
            </div>
          </Link>
        ))}
      </div>

      {/* Institutes section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[var(--ag-text)]">Institutos</h2>
          <Link
            href="/dashboard/admin/institutes"
            className="text-xs font-medium flex items-center gap-1 hover:underline"
            style={{ color: "var(--ag-navy)" }}
          >
            Ver todos <ArrowRight size={11} />
          </Link>
        </div>

        {instituteList.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[var(--ag-border-light)] p-12 text-center">
            <Building2 size={40} className="mx-auto mb-3 text-[var(--ag-text-muted)]" />
            <p className="text-[var(--ag-text-muted)] mb-4">
              No hay institutos creados todavía.
            </p>
            <Link
              href="/dashboard/admin/institutes/new"
              className="inline-flex px-5 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition"
              style={{ background: "var(--ag-navy)" }}
            >
              Crear primer instituto
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {instituteList.map((inst) => (
              <Link
                key={inst.id}
                href={`/dashboard/admin/institutes/${inst.id}`}
                className="group bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Color header bar */}
                <div
                  className="h-1.5"
                  style={{
                    background: `linear-gradient(to right, ${inst.primary_color}, ${inst.secondary_color ?? inst.primary_color})`,
                  }}
                />

                <div className="p-5">
                  {/* Institute name + status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${inst.primary_color}, ${inst.secondary_color ?? inst.primary_color})`,
                        }}
                      >
                        {inst.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[var(--ag-text)] truncate">{inst.name}</h3>
                        <p className="text-xs text-[var(--ag-text-muted)]">/{inst.slug}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ml-2 ${
                      inst.active
                        ? "bg-green-100/60 text-green-700"
                        : "bg-red-100/60 text-red-600"
                    }`}>
                      {inst.active ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  {inst.domain && (
                    <p className="text-xs text-[var(--ag-text-muted)] mb-3 flex items-center gap-1">
                      <Globe size={11} /> {inst.domain}
                    </p>
                  )}

                  {/* Stats row */}
                  <div className="flex gap-4 text-sm text-[var(--ag-text-muted)] mb-4">
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {profilesByInstitute[inst.id]?.students ?? 0} alumnos
                    </span>
                    <span className="flex items-center gap-1">
                      <UserCog size={12} />
                      {profilesByInstitute[inst.id]?.teachers ?? 0} prof.
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen size={12} />
                      {coursesByInstitute[inst.id] ?? 0} cursos
                    </span>
                  </div>

                  {/* Manage CTA */}
                  <div
                    className="flex items-center justify-center w-full py-1.5 rounded-xl border text-xs font-medium transition-colors group-hover:bg-[rgba(30,58,95,0.06)]"
                    style={{ borderColor: "rgba(30,58,95,0.18)", color: "var(--ag-navy)" }}
                  >
                    Gestionar <ArrowRight size={11} className="ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* New institute shortcut at bottom */}
        {instituteList.length > 0 && (
          <div className="mt-4">
            <Link
              href="/dashboard/admin/institutes/new"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-dashed text-sm font-medium transition-all hover:bg-[rgba(30,58,95,0.04)]"
              style={{ borderColor: "rgba(30,58,95,0.18)", color: "var(--ag-navy)" }}
            >
              <Plus size={14} /> Nuevo instituto
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
