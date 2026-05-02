"use client";

import { useState } from "react";
import Link from "next/link";
import type { Course, AcademicPeriod } from "@/lib/types";
import { useTeacherCourses, useEnrollmentCounts } from "@/lib/hooks/use-data";
import {
  EditCourseButton,
  DeleteCourseButton,
} from "@/components/ui/CourseActions";

interface Props {
  teacherId: string;
  periods: AcademicPeriod[];
}

const ACCENT_COLORS = [
  "var(--ag-navy)",
  "#2D6A4F",
  "#6B3FA0",
  "#1D6F8E",
  "#8B4513",
  "#1A5F4A",
];

export default function TeacherCoursesView({ teacherId, periods }: Props) {
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const { data: courses = [], isLoading } = useTeacherCourses(teacherId);
  const courseIds = courses.map((c: Course) => c.id);
  const { data: countMap = {} } = useEnrollmentCounts(courseIds);

  const filtered =
    periodFilter === "all"
      ? courses
      : periodFilter === "none"
      ? courses.filter((c: Course) => !c.period_id)
      : courses.filter((c: Course) => c.period_id === periodFilter);

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="skeleton-shimmer h-7 w-40 rounded mb-2" />
            <div className="skeleton-shimmer h-4 w-24 rounded" />
          </div>
          <div className="skeleton-shimmer h-9 w-32 rounded-lg" />
        </div>
        <div className="grid gap-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="skeleton-shimmer rounded-xl h-24"
            />
          ))}
        </div>
      </div>
    );
  }

  const published = courses.filter((c: Course) => c.published).length;

  const chipBase = "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors";
  const chipActive = { background: "var(--ag-navy)", color: "#fff" };
  const chipInactive = { background: "rgba(30,58,95,0.07)", color: "var(--ag-text-muted)" };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--ag-text)" }}>
            Mis cursos
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--ag-text-muted)" }}>
            {courses.length} curso{courses.length !== 1 ? "s" : ""} &middot;{" "}
            {published} publicado{published !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/teacher/courses/new"
          className="ag-btn-primary px-4 py-2 text-sm"
        >
          + Nuevo curso
        </Link>
      </div>

      {/* Period filter */}
      {periods.length > 0 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setPeriodFilter("all")}
            className={chipBase}
            style={periodFilter === "all" ? chipActive : chipInactive}
          >
            Todos
          </button>
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriodFilter(p.id)}
              className={chipBase}
              style={periodFilter === p.id ? chipActive : chipInactive}
            >
              {p.name}
              {p.is_active && (
                <span className="ml-1 text-[10px] opacity-70">●</span>
              )}
            </button>
          ))}
          <button
            onClick={() => setPeriodFilter("none")}
            className={chipBase}
            style={periodFilter === "none" ? chipActive : chipInactive}
          >
            Sin periodo
          </button>
        </div>
      )}

      {/* Empty states */}
      {filtered.length === 0 && courses.length > 0 ? (
        <div
          className="rounded-xl p-12 text-center bg-white"
          style={{ border: "2px dashed var(--ag-border-light)" }}
        >
          <p className="text-sm" style={{ color: "var(--ag-text-muted)" }}>
            No hay cursos en este periodo.
          </p>
        </div>
      ) : filtered.length === 0 ? (
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
          {filtered.map((course: Course, idx: number) => {
            const count = (countMap as Record<string, number>)[course.id] ?? 0;
            const accentColor = ACCENT_COLORS[idx % ACCENT_COLORS.length];

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
                    {course.title.charAt(0).toUpperCase()}
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
                    <p className="text-xl font-bold" style={{ color: "var(--ag-navy)" }}>
                      {count}
                    </p>
                    <p className="text-xs" style={{ color: "var(--ag-text-muted)" }}>
                      alumnos
                    </p>
                  </div>
                </div>

                {/* Actions row */}
                <div
                  className="flex items-center justify-between gap-3 px-4 py-2.5 flex-wrap"
                  style={{ borderTop: "1px solid var(--ag-border-light)" }}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { label: "Materiales", href: `/dashboard/teacher/courses/${course.id}/materials` },
                      { label: "Alumnos",    href: `/dashboard/teacher/courses/${course.id}/students` },
                      { label: "Tareas",     href: `/dashboard/teacher/courses/${course.id}/assignments` },
                      { label: "Quizzes",    href: `/dashboard/teacher/courses/${course.id}/quizzes` },
                    ].map(({ label, href }) => (
                      <Link
                        key={label}
                        href={href}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{
                          background: "rgba(30,58,95,0.06)",
                          color: "var(--ag-navy)",
                          border: "1px solid rgba(30,58,95,0.12)",
                        }}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <EditCourseButton course={course} />
                    <DeleteCourseButton
                      courseId={course.id}
                      courseTitle={course.title}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
