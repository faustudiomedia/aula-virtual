"use client";

import { useCourse, useCourseEnrollments } from "@/lib/hooks/use-data";
import ProgressBar from "@/components/ui/ProgressBar";
import { CourseBulkEnrollment } from "@/components/ui/CourseBulkEnrollment";

interface EnrollmentRow {
  id: string;
  progress: number;
  completed: boolean;
  enrolled_at: string;
  profiles: { full_name: string; email: string; avatar_url: string | null } | null;
}

interface Props {
  courseId: string;
}

export default function CourseStudentsView({ courseId }: Props) {
  const { data: course, isLoading: loadingCourse } = useCourse(courseId);
  const { data: enrollments = [], isLoading: loadingEnrollments } =
    useCourseEnrollments(courseId);
  const typedEnrollments = enrollments as EnrollmentRow[];

  const isLoading = loadingCourse || loadingEnrollments;

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
          <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-40 mb-8" />
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm h-48" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <p className="text-[var(--ag-text-muted)]">Curso no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <a
        href="/dashboard/teacher"
        className="text-[var(--ag-navy)] hover:underline text-sm"
      >
        ← Mis cursos
      </a>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ag-text)] mt-2 mb-1">
            {course.title}
          </h1>
          <p className="text-[var(--ag-text-muted)]">
            {enrollments.length} alumno{enrollments.length !== 1 ? "s" : ""}{" "}
            inscripto{enrollments.length !== 1 ? "s" : ""}
          </p>
        </div>
        <CourseBulkEnrollment 
           courseId={courseId} 
           courseTitle={course.title} 
           currentEnrollments={typedEnrollments} 
        />
      </div>

      {enrollments.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--ag-border-light)] p-10 text-center">
          <p className="text-[var(--ag-text-muted)]">Ningún alumno inscripto todavía.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[rgba(30,58,95,0.06)] border-b border-black/5">
              <tr>
                <th className="text-left px-5 py-3 text-[var(--ag-text-muted)] font-medium">
                  Alumno
                </th>
                <th className="text-left px-5 py-3 text-[var(--ag-text-muted)] font-medium">
                  Progreso
                </th>
                <th className="text-left px-5 py-3 text-[var(--ag-text-muted)] font-medium">
                  Estado
                </th>
                <th className="text-left px-5 py-3 text-[var(--ag-text-muted)] font-medium">
                  Inscripción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {typedEnrollments.map((e) => (
                <tr
                  key={e.id}
                  className="hover:bg-[rgba(30,58,95,0.06)]/50 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--ag-navy)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {e.profiles?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={e.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (e.profiles?.full_name || e.profiles?.email || "?").charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-[var(--ag-text)]">
                          {e.profiles?.full_name || "Sin nombre"}
                        </p>
                        <p className="text-xs text-[var(--ag-text-muted)]">
                          {e.profiles?.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 w-48">
                    <ProgressBar value={e.progress} />
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        e.completed
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {e.completed ? "Completado" : "En curso"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[var(--ag-text-muted)]">
                    {new Date(e.enrolled_at).toLocaleDateString("es-AR", {
                      dateStyle: "short",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
