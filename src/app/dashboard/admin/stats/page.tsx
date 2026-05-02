import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatsCharts } from "@/components/ui/StatsCharts";

export default async function AdminStatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin" && profile?.role !== "super_admin") redirect("/dashboard/admin");

  // All counts done in the DB with exact count — no JS loops
  const [
    { count: totalInstitutes },
    { count: totalStudents },
    { count: totalTeachers },
    { count: totalCourses },
    { count: totalEnrollments },
    { data: progressStats },
    { data: enrollmentDates },
  ] = await Promise.all([
    supabase.from("institutes").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "alumno"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "profesor"),
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("enrollments").select("*", { count: "exact", head: true }),
    supabase.from("enrollments").select("progress, completed"),
    supabase.from("enrollments").select("created_at").order("created_at"),
  ]);

  // These two are simple derivations from the single enrollments query — no additional DB calls
  const enrollmentList = progressStats ?? [];
  const avgProgress = enrollmentList.length
    ? Math.round(
        enrollmentList.reduce(
          (s: number, e: { progress: number }) => s + e.progress,
          0,
        ) / enrollmentList.length,
      )
    : 0;
  const completionRate = enrollmentList.length
    ? Math.round(
        (enrollmentList.filter((e: { completed: boolean }) => e.completed)
          .length /
          enrollmentList.length) *
          100,
      )
    : 0;

  const stats = [
    {
      label: "Institutos",
      value: totalInstitutes ?? 0,
      icon: "🏛️",
      color: "var(--ag-navy)",
      bg: "#EFF6FF",
    },
    {
      label: "Alumnos",
      value: totalStudents ?? 0,
      icon: "🎒",
      color: "#059669",
      bg: "#ECFDF5",
    },
    {
      label: "Profesores",
      value: totalTeachers ?? 0,
      icon: "👩‍🏫",
      color: "#7C3AED",
      bg: "#F5F3FF",
    },
    {
      label: "Cursos",
      value: totalCourses ?? 0,
      icon: "📚",
      color: "#D97706",
      bg: "#FFFBEB",
    },
    {
      label: "Inscripciones",
      value: totalEnrollments ?? 0,
      icon: "✅",
      color: "#0891B2",
      bg: "#ECFEFF",
    },
    {
      label: "Progreso promedio",
      value: `${avgProgress}%`,
      icon: "📊",
      color: "#4F46E5",
      bg: "#EEF2FF",
    },
    {
      label: "Tasa de completitud",
      value: `${completionRate}%`,
      icon: "🏆",
      color: "#BE185D",
      bg: "#FDF2F8",
    },
  ];

  // Enrollments per month (last 6 months)
  const MONTH_ES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const now = new Date();
  const enrollmentsByMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const count = (enrollmentDates ?? []).filter((e: { created_at: string }) => {
      const ed = new Date(e.created_at);
      return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth();
    }).length;
    return { month: MONTH_ES[d.getMonth()], count };
  });

  type Bucket = {
    label: string;
    filter: (p: number) => boolean;
    color: string;
  };
  const buckets: Bucket[] = [
    { label: "Sin iniciar (0%)", filter: (p) => p === 0, color: "#E5E7EB" },
    {
      label: "Iniciado (1–33%)",
      filter: (p) => p >= 1 && p <= 33,
      color: "#FCA5A5",
    },
    {
      label: "En progreso (34–66%)",
      filter: (p) => p >= 34 && p <= 66,
      color: "var(--ag-navy)",
    },
    {
      label: "Avanzado (67–99%)",
      filter: (p) => p >= 67 && p <= 99,
      color: "var(--ag-navy)",
    },
    { label: "Completado (100%)", filter: (p) => p === 100, color: "#059669" },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--ag-text)] mb-2">
        Estadísticas globales
      </h1>
      <p className="text-[var(--ag-text-muted)] mb-8">
        Métricas generales de toda la plataforma.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-5 border border-black/5"
            style={{ background: stat.bg }}
          >
            <div className="text-2xl mb-2">{stat.icon}</div>
            <p className="text-3xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </p>
            <p className="text-sm text-[var(--ag-text-muted)] mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <StatsCharts
        enrollmentsByMonth={enrollmentsByMonth}
        progressBuckets={buckets.map(b => ({
          label: b.label,
          count: enrollmentList.filter((e: { progress: number }) => b.filter(e.progress)).length,
          color: b.color,
        }))}
      />
    </div>
  );
}
