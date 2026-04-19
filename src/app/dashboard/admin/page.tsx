import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Institute, UserRole } from "@/lib/types";
import { getDashboardPath } from "@/lib/auth/getDashboardPath";
import { Building2, GraduationCap, UserCog, BookOpen, Globe, Users } from "lucide-react";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  const profilesByInstitute: Record<
    string,
    { students: number; teachers: number }
  > = {};
  (allProfiles ?? []).forEach((p: { institute_id: string | null; role: UserRole }) => {
    if (!p.institute_id) return;
    const entry = profilesByInstitute[p.institute_id] ?? {
      students: 0,
      teachers: 0,
    };
    if (p.role === "alumno") entry.students++;
    if (p.role === "profesor") entry.teachers++;
    profilesByInstitute[p.institute_id] = entry;
  });

  const { data: allCourses } = await supabase
    .from("courses")
    .select("institute_id");
  const coursesByInstitute: Record<string, number> = {};
  (allCourses ?? []).forEach((c: { institute_id: string }) => {
    coursesByInstitute[c.institute_id] =
      (coursesByInstitute[c.institute_id] ?? 0) + 1;
  });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#050F1F]">
            Panel de Administración
          </h1>
          <p className="text-[#050F1F]/50 mt-1">
            Gestión global de institutos y usuarios.
          </p>
        </div>
        <Link
          href="/dashboard/admin/institutes/new"
          className="px-4 py-2.5 rounded-xl bg-[#1A56DB] text-white text-sm font-semibold
                     hover:opacity-90 transition shadow-lg shadow-[#1A56DB]/20 text-center"
        >
          + Nuevo instituto
        </Link>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Institutos",
            value: instituteList.length,
            Icon: Building2,
            color: "#1A56DB",
            bg: "#EFF6FF",
            border: "#BFDBFE",
          },
          {
            label: "Alumnos totales",
            value: Object.values(profilesByInstitute).reduce(
              (s, p) => s + p.students,
              0,
            ),
            Icon: GraduationCap,
            color: "#059669",
            bg: "#ECFDF5",
            border: "#A7F3D0",
          },
          {
            label: "Profesores",
            value: Object.values(profilesByInstitute).reduce(
              (s, p) => s + p.teachers,
              0,
            ),
            Icon: UserCog,
            color: "#7C3AED",
            bg: "#F5F3FF",
            border: "#DDD6FE",
          },
          {
            label: "Cursos",
            value: Object.values(coursesByInstitute).reduce((s, n) => s + n, 0),
            Icon: BookOpen,
            color: "#D97706",
            bg: "#FFFBEB",
            border: "#FDE68A",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-5 border"
            style={{ background: stat.bg, borderColor: stat.border }}
          >
            <stat.Icon size={20} className="mb-2" style={{ color: stat.color }} />
            <p className="text-3xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </p>
            <p className="text-sm font-medium mt-1" style={{ color: stat.color + "99" }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Institutes grid */}
      <h2 className="text-lg font-semibold text-[#050F1F] mb-4">Institutos</h2>

      {instituteList.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#BAE6FD] p-12 text-center">
          <Building2 size={40} className="mx-auto mb-3 text-[#BAE6FD]" />
          <p className="text-[#050F1F]/50 mb-4">
            No hay institutos creados todavía.
          </p>
          <Link
            href="/dashboard/admin/institutes/new"
            className="inline-flex px-5 py-2 rounded-xl bg-[#1A56DB] text-white text-sm font-semibold hover:opacity-90 transition"
          >
            Crear primer instituto
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {instituteList.map((inst) => (
            <div
              key={inst.id}
              className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Color header */}
              <div
                className="h-2"
                style={{
                  background: `linear-gradient(to right, ${inst.primary_color}, ${inst.secondary_color})`,
                }}
              />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow"
                      style={{
                        background: `linear-gradient(135deg, ${inst.primary_color}, ${inst.secondary_color})`,
                      }}
                    >
                      {inst.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#050F1F]">
                        {inst.name}
                      </h3>
                      <p className="text-xs text-[#050F1F]/40">/{inst.slug}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      inst.active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {inst.active ? "Activo" : "Inactivo"}
                  </span>
                </div>

                {inst.domain && (
                  <p className="text-xs text-[#050F1F]/40 mb-3 flex items-center gap-1">
                    <Globe size={11} /> {inst.domain}
                  </p>
                )}

                <div className="flex gap-4 text-sm text-[#050F1F]/60 mb-4">
                  <span className="flex items-center gap-1">
                    <Users size={12} /> {profilesByInstitute[inst.id]?.students ?? 0} alumnos
                  </span>
                  <span className="flex items-center gap-1">
                    <UserCog size={12} /> {profilesByInstitute[inst.id]?.teachers ?? 0} prof.
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen size={12} /> {coursesByInstitute[inst.id] ?? 0} cursos
                  </span>
                </div>

                {/* Color swatches */}
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-5 h-5 rounded-full border border-black/10"
                    style={{ background: inst.primary_color }}
                    title={inst.primary_color}
                  />
                  <div
                    className="w-5 h-5 rounded-full border border-black/10"
                    style={{ background: inst.secondary_color }}
                    title={inst.secondary_color}
                  />
                  <span className="text-xs text-[#050F1F]/30">
                    {inst.primary_color} · {inst.secondary_color}
                  </span>
                </div>

                <Link
                  href={`/dashboard/admin/institutes/${inst.id}`}
                  className="flex items-center justify-center w-full py-1.5 rounded-lg border border-[#BAE6FD] text-[#1A56DB] text-xs font-medium hover:bg-[#F0F9FF] transition-colors"
                >
                  Gestionar →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
