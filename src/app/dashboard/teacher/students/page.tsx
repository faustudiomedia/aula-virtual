import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProgressBar from "@/components/ui/ProgressBar";

export default async function AllStudentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, institute_id")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "profesor" && profile?.role !== "super_admin") redirect("/dashboard");

  // super_admin sees all students across institutes; profesor sees only their institute
  let studentsQuery = supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, created_at")
    .eq("role", "alumno")
    .order("full_name");

  if (profile?.role === "profesor" && profile.institute_id) {
    studentsQuery = studentsQuery.eq("institute_id", profile.institute_id);
  }

  const { data: students } = await studentsQuery;

  // Get enrollment stats for each student
  const studentIds = (students ?? []).map((s) => s.id);
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("student_id, progress, completed")
    .in("student_id", studentIds);

  const statsMap: Record<
    string,
    { total: number; avgProgress: number; completed: number }
  > = {};
  (enrollments ?? []).forEach((e) => {
    const s = statsMap[e.student_id] ?? {
      total: 0,
      avgProgress: 0,
      completed: 0,
    };
    s.total++;
    s.avgProgress += e.progress;
    if (e.completed) s.completed++;
    statsMap[e.student_id] = s;
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--ag-text)] mb-2">
        Alumnos
      </h1>
      <p className="text-[var(--ag-text-muted)] mb-8">
        {students?.length ?? 0} alumno{(students?.length ?? 0) !== 1 ? "s" : ""}{" "}
        registrado{(students?.length ?? 0) !== 1 ? "s" : ""}
      </p>

      {(students ?? []).length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--ag-border-light)] p-10 text-center">
          <p className="text-[var(--ag-text-muted)]">
            No hay alumnos registrados en este instituto.
          </p>
        </div>
      ) : (
        <div className="bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[rgba(30,58,95,0.06)] border-b border-[var(--ag-border-light)]">
              <tr>
                <th className="text-left px-5 py-3 text-[var(--ag-text-muted)] font-medium">
                  Alumno
                </th>
                <th className="text-left px-5 py-3 text-[var(--ag-text-muted)] font-medium">
                  Cursos
                </th>
                <th className="text-left px-5 py-3 text-[var(--ag-text-muted)] font-medium">
                  Progreso promedio
                </th>
                <th className="text-left px-5 py-3 text-[var(--ag-text-muted)] font-medium">
                  Completados
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ag-border-light)]">
              {(students ?? []).map((student) => {
                const stats = statsMap[student.id];
                const avg = stats
                  ? Math.round(stats.avgProgress / stats.total)
                  : 0;
                return (
                  <tr
                    key={student.id}
                    className="hover:bg-[rgba(30,58,95,0.06)]/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--ag-navy)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {student.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={student.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (student.full_name || student.email).charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--ag-text)]">
                            {student.full_name || "Sin nombre"}
                          </p>
                          <p className="text-xs text-[var(--ag-text-muted)]">
                            {student.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[var(--ag-text)]">
                      {stats?.total ?? 0}
                    </td>
                    <td className="px-5 py-3.5 w-40">
                      {stats ? (
                        <ProgressBar value={avg} />
                      ) : (
                        <span className="text-[var(--ag-text)]/30 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-[var(--ag-text)]">
                      {stats?.completed ?? 0}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/dashboard/messages/${student.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--ag-navy)] border border-[var(--ag-navy)]/20 hover:bg-[var(--ag-navy)]/5 transition-all"
                      >
                        Mensaje
                      </Link>
                    </td>
              
