"use client";

import Link from "next/link";
import { useTeacherCourses, useEnrollmentCounts } from "@/lib/hooks/use-data";
import {
  EditCourseButton,
  DeleteCourseButton,
} from "@/components/ui/CourseActions";

interface Props {
  teacherId: string;
  teacherName: string;
}

export default function TeacherDashboardView({
  teacherId,
  teacherName: _teacherName,
}: Props) {
  const { data: courses = [], isLoading } = useTeacherCourses(teacherId);
  const courseIds = courses.map((c) => c.id);
  const { data: countMap = {} } = useEnrollmentCounts(courseIds);

  const totalStudents = Object.values(countMap).reduce((a, b) => a + b, 0);

  const header = (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-[#050F1F]">Panel del Profesor</h1>
        <p className="text-[#050F1F]/50 mt-1">
          Gestioná tus cursos y seguí el progreso de tus alumnos.
        </p>
      </div>
      <Link
        href="/dashboard/teacher/courses/new"
        className="px-4 py-2 rounded-xl bg-[#1A56DB] text-white text-sm font-semibold hover:bg-[#1A56DB]/90 transition-colors shadow-lg shadow-[#1A56DB]/20"
      >
        + Nuevo curso
      </Link>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        {header}
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-black/5 p-5 shadow-sm animate-pulse h-24"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {header}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          {
            label: "Cursos activos",
            value: courses.filter((c) => c.published).length,
            color: "#1A56DB",
            bg: "#EFF6FF",
          },
          {
            label: "Cursos totales",
            value: courses.length,
            color: "#7C3AED",
            bg: "#F5F3FF",
          },
          {
            label: "Alumnos inscriptos",
            value: totalStudents,
            color: "#059669",
            bg: "#ECFDF5",
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

      {/* Courses */}
      <h2 className="text-lg font-semibold text-[#050F1F] mb-4">Mis cursos</h2>
      {courses.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#BAE6FD] p-12 text-center">
          <p className="text-4xl mb-3">🎓</p>
          <p className="text-[#050F1F]/50 mb-4">
            Todavía no creaste ningún curso.
          </p>
          <Link
            href="/dashboard/teacher/courses/new"
            className="inline-flex px-5 py-2 rounded-xl bg-[#1A56DB] text-white text-sm font-semibold hover:opacity-90 transition"
          >
            Crear primer curso
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-2xl border border-black/5 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1A56DB] to-[#38BDF8] flex items-center justify-center text-white font-bold flex-shrink-0">
                {course.title.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-[#050F1F] truncate">
                    {course.title}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                      course.published
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {course.published ? "Publicado" : "Borrador"}
                  </span>
                </div>
                <p className="text-sm text-[#050F1F]/50 truncate">
                  {course.description ?? "Sin descripción"}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold text-[#1A56DB]">
                  {countMap[course.id] ?? 0}
                </p>
                <p className="text-xs text-[#050F1F]/40">alumnos</p>
              </div>
              <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                <Link
                  href={`/dashboard/teacher/courses/${course.id}/materials`}
                  className="px-3 py-1.5 rounded-lg bg-[#F0F9FF] hover:bg-[#BAE6FD]/40 text-[#1A56DB] text-xs font-medium transition-colors border border-[#BAE6FD]"
                >
                  Materiales
                </Link>
                <Link
                  href={`/dashboard/teacher/courses/${course.id}/students`}
                  className="px-3 py-1.5 rounded-lg bg-[#F0F9FF] hover:bg-[#BAE6FD]/40 text-[#1A56DB] text-xs font-medium transition-colors border border-[#BAE6FD]"
                >
                  Alumnos
                </Link>
                <EditCourseButton course={course} />
                <DeleteCourseButton
                  courseId={course.id}
                  courseTitle={course.title}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
