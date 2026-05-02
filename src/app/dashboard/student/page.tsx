import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Enrollment, Course } from "@/lib/types";
import { getDashboardPath } from "@/lib/auth/getDashboardPath";
import { BookOpen, CheckCircle, TrendingUp, ChevronRight } from "lucide-react";
import { CourseCard } from "@/components/dashboard/CourseCard";

type EnrollmentWithCourse = Enrollment & { courses: Course };

export default async function StudentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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

  const firstName = profile?.full_name?.split(" ")[0] ?? "Alumno";

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--ag-text)" }}>
          Hola, {firstName}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--ag-text-muted)" }}>
          Aquí tenés un resumen de tu progreso académico.
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          { icon: BookOpen,    label: "Cursos inscriptos",  value: items.length,          color: "var(--ag-navy)", bg: "rgba(30,58,95,0.08)",   border: "rgba(30,58,95,0.14)" },
          { icon: CheckCircle, label: "Cursos completados", value: completed,              color: "#059669",        bg: "rgba(5,150,105,0.08)",  border: "rgba(5,150,105,0.14)" },
          { icon: TrendingUp,  label: "Progreso promedio",  value: `${avgProgress}%`,     color: "#D97706",        bg: "rgba(217,119,6,0.08)",  border: "rgba(217,119,6,0.14)" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-2xl p-5 border flex items-center gap-4"
              style={{ background: stat.bg, borderColor: stat.border }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(4px)" }}
              >
                <Icon size={18} style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none tabular-nums" style={{ color: stat.color }}>
                  {stat.value}
                </p>
                <p className="text-xs mt-1 font-medium text-[var(--ag-text-muted)]">
                  {stat.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Course list ── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold" style={{ color: "var(--ag-text)" }}>
          Mis cursos
        </h2>
        <Link href="/dashboard/student/courses"
          className="text-xs font-medium flex items-center gap-1 transition-colors"
          style={{ color: "var(--ag-navy)" }}>
          Ver catálogo <ChevronRight size={14} />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl p-12 text-center border-2 border-dashed border-[var(--ag-border-light)]">
          <BookOpen size={32} className="mx-auto mb-3" style={{ color: "var(--ag-text-light)" }} />
          <p className="text-sm" style={{ color: "var(--ag-text-muted)" }}>
            Todavía no estás inscripto en ningún curso.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((enrollment, idx) => (
            <CourseCard
              key={enrollment.id}
              enrollmentId={enrollment.id}
              courseId={enrollment.courses.id}
              title={enrollment.courses.title}
              description={enrollment.courses.description}
              progress={enrollment.progress}
              completed={enrollment.completed}
              defaultAccentIdx={idx}
            />
          ))}
        </div>
      )}
    </div>
  );
}
