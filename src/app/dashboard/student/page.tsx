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
          { icon: BookOpen,    label: "Cursos inscriptos",  value: items.length, accent: "var(--ag-navy)" },
          { icon: CheckCircle, label: "Cursos completados", value: completed,    accent: "#166534" },
          { icon: TrendingUp,  label: "Progreso promedio",  value: `${avgProgress}%`, accent: "#92400E" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl p-5 flex items-center gap-4"
              style={{ border: "1px solid var(--ag-border-light)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${stat.accent}18` }}>
                <Icon size={18} style={{ color: stat.accent }} />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none" style={{ color: stat.accent }}>
                  {stat.value}
                </p>
                <p className="text-xs mt-1 font-medium" style={{ color: "var(--ag-text-muted)" }}>
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
        <div className="rounded-xl p-12 text-center bg-white"
          style={{ border: "2px dashed var(--ag-border-light)" }}>
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
