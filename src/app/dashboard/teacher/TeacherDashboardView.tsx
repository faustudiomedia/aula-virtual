"use client";

import Link from "next/link";
import type { Course } from "@/lib/types";
import { useTeacherCourses, useEnrollmentCounts, useActiveStudentsThisWeek } from "@/lib/hooks/use-data";
import {
  EditCourseButton,
  DeleteCourseButton,
} from "@/components/ui/CourseActions";
import { BookOpen, Users, TrendingUp, Activity } from "lucide-react";

interface Props {
  teacherId: string;
  teacherName: string;
}

export default function TeacherDashboardView({
  teacherId,
  teacherName: _teacherName,
}: Props) {
  const { data: courses = [], isLoading } = useTeacherCourses(teacherId);
  const courseIds = courses.map((c: Course) => c.id);
  const { data: countMap = {} } = useEnrollmentCounts(courseIds);
  const { data: activeThisWeek = 0 } = useActiveStudentsThisWeek(courseIds);

  const totalStudents = Object.values(countMap as Record<string, number>).reduce(
    (a: number, b: number) => a + b,
    0
  );

  const stats = [
    {
      label: "Cursos activos",
      value: courses.filter((c: Course) => c.published).length,
      icon: BookOpen,
    },
    {
      label: "Cursos totales",
      value: courses.length,
      icon: TrendingUp,
    },
    {
      label: "Alumnos inscriptos",
      value: totalStudents,
      icon: Users,
    },
    {
      label: "Activos esta semana",
      value: activeThisWeek,
      icon: Activity,
    },
  ];

  const header = (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--ag-text)" }}>
          Panel del Profesor
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--ag-text-muted)" }}>
          Gestioná tus cursos y seguí el progreso de tus alumnos.
        </p>
      </div>
      <Link
        href="/dashboard/teacher/courses/new"
        className="ag-btn-primary px-4 py-2 text-sm"
      >
        + Nuevo curso
      </Link>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        {header}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="skeleton-shimmer rounded-xl h-24"
            />
          ))}
        </div>
        <div className="grid gap-4">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border h-20 skeleton-shimmer"
              style={{ borderColor: "var(--ag-border-light)" }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {header}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-5 flex flex-col gap-3"
              style={{
                border: "1px solid var(--ag-border-light)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(30,58,95,0.08)" }}
              >
                <Icon size={16} style={{ color: "var(--ag-navy)" }} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: "var(--ag-navy)" }}>
                  {stat.value}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--ag-text-muted)" }}>
                  {stat.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Courses */}
      <h2 className="text-base font-semibold mb-4" style={{ color: "var(--ag-text)" }}>
        Mis cursos
      </h2>

      {courses.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center bg-white"
          style={{ border: "2px dashed var(--ag-border-light)" }}
        >
          <p className="text-4xl mb-3">🎓</p>
          <p className="text-sm mb-4" style={{ color: "var(--ag-text-muted)" }}>
            Todavia no creaste ningun curso.
          </p>
          <Link
            href="/dashboard/teacher/courses/new"
            className="ag-btn-primary inline-flex px-5 py-2 text-sm"
          >
            Crear primer curso
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {courses.map((course: Course, idx: number) => {
            const initial = course.title.charAt(0).toUpperCase();
            const hues = [
              "var(--ag-navy)",
              "#2D6A4F",
              "#6B3FA0",
              "#1D6F8E",
              "#8B4513",
              "#1A5F4A",
            ];
            const accentColor = hues[idx % hues.length];

            return (
              <div
                key={course.id}
                className="bg-white rounded-xl overflow-hidden transition-shadow hover:shadow-md"
                style={{
                  border: "1px solid var(--ag-border-light)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                }}
              >
                {/* Info row */}
                <div className="flex items-center gap-4 p-4">
                  <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                    style={{ background: accentColor }}
                  >
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className="font-semibold text-sm"
                        style={{ color: "var(--ag-text)" }}
                      >
                        {course.title}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0 ${
                          course.published
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {course.published ? "Publicado" : "Borrador"}
                      </span>
                    </div>
                    <p
                      className="text-xs mt-0.5 truncate"
                      style={{ color: "var(--ag-text-muted)" }}
                    >
                      {course.description ?? "Sin descripcion"}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className="text-xl font-bold"
                      style={{ color: "var(--ag-navy)" }}
                    >
                      {countMap[course.id] ?? 0}
                    </p>
                    <p className="text-xs" style={{ color: "var(--ag-text-muted)" }}>
                      alumnos
                    </p>
                  </div>
                </div>

                {/* Actions row */}
                <div
                  className="flex items-center gap-2 px-4 py-2.5 flex-wrap"
                  style={{ borderTop: "1px solid var(--ag-border-light)" }}
                >
                  <Link
                    href={`/dashboard/teacher/courses/${course.id}/materials`}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: "rgba(30,58,95,0.06)",
                      color: "var(--ag-navy)",
                      border: "1px solid rgba(30,58,95,0.12)",
                    }}
                  >
                    Materiales
                  </Link>
                  <Link
                    href={`/dashboard/teacher/courses/${course.id}/students`}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: "rgba(30,58,95,0.06)",
                      color: "var(--ag-navy)",
                      border: "1px solid rgba(30,58,95,0.12)",
                    }}
                  >
                    Alumnos
                  </Link>
                  <div className="flex-1" />
                  <EditCourseButton course={course} />
                  <DeleteCourseButton
                    courseId={course.id}
                    courseTitle={course.title}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
