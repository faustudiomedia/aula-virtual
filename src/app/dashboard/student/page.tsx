import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProgressBar from "@/components/ui/ProgressBar";
import type { Enrollment, Course } from "@/lib/types";
import { getDashboardPath } from "@/lib/auth/getDashboardPath";

type EnrollmentWithCourse = Enrollment & { courses: Course };

export default async function StudentDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "alumno")
    redirect(getDashboardPath(profile?.role ?? "alumno"));

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("*, courses(*)")
    .eq("student_id", user.id)
    .order("enrolled_at", { ascending: false });

  const items = (enrollments ?? []) as EnrollmentWithCourse[];
  const completed = items.filter((e) => e.completed).length;
  const avgProgress = items.length
    ? Math.round(items.reduce((sum, e) => sum + e.progress, 0) / items.length)
    : 0;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#050F1F]">
          Hola, {profile?.full_name?.split(" ")[0] ?? "Alumno"} 👋
        </h1>
        <p className="text-[#050F1F]/50 mt-1">
          Aquí tenés un resumen de tu progreso académico.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          {
            label: "Cursos inscriptos",
            value: items.length,
            color: "#1A56DB",
            bg: "#EFF6FF",
          },
          {
            label: "Cursos completados",
            value: completed,
            color: "#059669",
            bg: "#ECFDF5",
          },
          {
            label: "Progreso promedio",
            value: `${avgProgress}%`,
            color: "#D97706",
            bg: "#FFFBEB",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-5 border border-black/5"
            style={{ background: stat.bg }}
          >
            <p className="text-3xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </p>
            <p className="text-sm text-[#050F1F]/60 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Course list */}
      <h2 className="text-lg font-semibold text-[#050F1F] mb-4">Mis cursos</h2>

      {items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#BAE6FD] p-12 text-center">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-[#050F1F]/50">
            Todavía no estás inscripto en ningún curso.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((enrollment) => (
            <div
              key={enrollment.id}
              className="bg-white rounded-2xl border border-black/5 p-5 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Cover placeholder */}
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1A56DB] to-[#38BDF8] flex-shrink-0 flex items-center justify-center text-white text-xl font-bold">
                {enrollment.courses.title.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-[#050F1F] truncate">
                    {enrollment.courses.title}
                  </h3>
                  {enrollment.completed && (
                    <span className="ml-2 px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium flex-shrink-0">
                      Completado
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#050F1F]/50 mb-2 line-clamp-1">
                  {enrollment.courses.description ?? "Sin descripción"}
                </p>
                <ProgressBar value={enrollment.progress} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
