import { redirect } from "next/navigation";
import Link from "next/link";
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

  if (!profile || (profile.role !== "alumno" && profile.role !== "super_admin"))
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((enrollment, idx) => {
            const GRADIENTS = [
              ["#1A56DB","#38BDF8"],["#7C3AED","#A78BFA"],["#059669","#34D399"],
              ["#D97706","#FCD34D"],["#DC2626","#F87171"],["#0891B2","#67E8F9"],
            ]
            const [from, to] = GRADIENTS[idx % GRADIENTS.length]
            return (
              <Link
                key={enrollment.id}
                href={`/dashboard/student/courses/${enrollment.courses.id}`}
                className="block bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="h-20 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
                  <span className="text-3xl font-bold text-white/90">{enrollment.courses.title.charAt(0)}</span>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <h3 className="font-semibold text-[#050F1F] truncate text-sm">{enrollment.courses.title}</h3>
                    {enrollment.completed && (
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium flex-shrink-0">✓ Completado</span>
                    )}
                  </div>
                  <p className="text-xs text-[#050F1F]/40 mb-3 line-clamp-1">{enrollment.courses.description ?? "Sin descripción"}</p>
                  <ProgressBar value={enrollment.progress} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  );
}
