import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatsCharts } from "@/components/ui/StatsCharts";
import { Building2, GraduationCap, UserCog, BookOpen, ClipboardList, TrendingUp, Trophy } from "lucide-react";

export default async function AdminStatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin" && profile?.role !== "super_admin") redirect("/dashboard/admin");

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

  const enrollmentList = progressStats ?? [];
  const avgProgress = enrollmentList.length
    ? Math.round(enrollmentList.reduce((s: number, e: { progress: number }) => s + e.progress, 0) / enrollmentList.length)
    : 0;
  const completionRate = enrollmentList.length
    ? Math.round((enrollmentList.filter((e: { completed: boolean }) => e.completed).length / enrollmentList.length) * 100)
    : 0;

  const stats = [
    { label: "Institutos",        value: totalInstitutes ?? 0, Icon: Building2,    color: "var(--ag-navy)", bg: "rgba(30,58,95,0.08)",    border: "rgba(30,58,95,0.14)" },
    { label: "Alumnos",           value: totalStudents ?? 0,   Icon: GraduationCap, color: "#059669",        bg: "rgba(5,150,105,0.08)",   border: "rgba(5,150,105,0.14)" },
    { label: "Profesores",        value: totalTeachers ?? 0,   Icon: UserCog,       color: "#7C3AED",        bg: "rgba(124,58,237,0.08)",  border: "rgba(124,58,237,0.14)" },
    { label: "Cursos",            value: totalCourses ?? 0,    Icon: BookOpen,      color: "#D97706",        bg: "rgba(217,119,6,0.08)",   border: "rgba(217,119,6,0.14)" },
    { label: "Inscripciones",     value: totalEnrollments ?? 0, Icon: ClipboardList, color: "#0891B2",       bg: "rgba(8,145,178,0.08)",   border: "rgba(8,145,178,0.14)" },
    { label: "Progreso promedio", value: `${avgProgress}%`,    Icon: TrendingUp,    color: "#4F46E5",        bg: "rgba(79,70,229,0.08)",   border: "rgba(79,70,229,0.14)" },
    { label: "Tasa completitud",  value: `${completionRate}%`, Icon: Trophy,        color: "#BE185D",        bg: "rgba(190,24,93,0.08)",   border: "rgba(190,24,93,0.14)" },
  ];

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

  type Bucket = { label: string; filter: (p: number) => boolean; color: string };
  const buckets: Bucket[] = [
    { label: "Sin iniciar (0%)",     filter: (p) => p === 0,           color: "#E5E7EB" },
    { label: "Iniciado (1–33%)",     filter: (p) => p >= 1 && p <= 33, color: "#FCA5A5" },
    { label: "En progreso (34–66%)", filter: (p) => p >= 34 && p <= 66, color: "var(--ag-navy)" },
    { label: "Avanzado (67–99%)",    filter: (p) => p >= 67 && p <= 99, color: "#6366F1" },
    { label: "Completado (100%)",    filter: (p) => p === 100,          color: "#059669" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--ag-text)]">Estadísticas globales</h1>
        <p className="text-[var(--ag-text-muted)] mt-1 text-sm">Métricas generales de toda la plataforma.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-5 border"
            style={{ background: stat.bg, borderColor: stat.border }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(4px)" }}
            >
              <stat.Icon size={20} style={{ color: stat.color }} />
            </div>
            <p className="text-3xl font-bold text-[var(--ag-text)] mb-1 tabular-nums">{stat.value}</p>
            <p className="text-sm font-semibold" style={{ color: stat.color }}>{stat.label}</p>
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
