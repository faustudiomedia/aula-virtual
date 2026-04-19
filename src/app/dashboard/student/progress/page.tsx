import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProgressBar from "@/components/ui/ProgressBar";
import type { Enrollment, Course } from "@/lib/types";

type EnrollmentWithCourse = Enrollment & { courses: Course };

export default async function StudentProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("*, courses(*)")
    .eq("student_id", user.id)
    .order("progress", { ascending: false });

  const items = (enrollments ?? []) as EnrollmentWithCourse[];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-[#050F1F] mb-2">Mi progreso</h1>
      <p className="text-[#050F1F]/50 mb-8">
        Seguimiento detallado de todos tus cursos.
      </p>

      {items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#BAE6FD] p-12 text-center">
          <p className="text-[#050F1F]/50">No hay datos de progreso todavía.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((e) => (
            <div
              key={e.id}
              className="bg-white rounded-2xl border border-black/5 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[#050F1F]">
                  {e.courses.title}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    e.completed
                      ? "bg-green-100 text-green-700"
                      : e.progress > 50
                        ? "bg-blue-100 text-blue-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {e.completed
                    ? "Completado"
                    : e.progress > 50
                      ? "En progreso"
                      : "Iniciado"}
                </span>
              </div>
              <ProgressBar value={e.progress} />
              <p className="text-xs text-[#050F1F]/40 mt-2">
                Inscripto el{" "}
                {new Date(e.enrolled_at).toLocaleDateString("es-AR", {
                  dateStyle: "medium",
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
