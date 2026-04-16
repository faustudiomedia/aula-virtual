"use client";

import { useState } from "react";
import { useCoursesForInstitute, useEnrollments } from "@/lib/hooks/use-data";
import EnrollButton from "@/components/ui/EnrollButton";

interface Props {
  instituteId: string | null;
  userId: string;
}

export default function StudentCoursesCatalogView({
  instituteId,
  userId,
}: Props) {
  const { data: courses = [], isLoading: loadingCourses } =
    useCoursesForInstitute(instituteId);
  const { data: enrollments = [], isLoading: loadingEnrollments } =
    useEnrollments(userId);
  const [search, setSearch] = useState("");

  const isLoading = loadingCourses || loadingEnrollments;
  const enrolledCourseIds = new Set(enrollments.map((e) => e.course_id));

  const filtered = search.trim()
    ? courses.filter((c) =>
        c.title.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : courses;

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#050F1F]">
            Mis cursos
          </h1>
          <p className="text-[#050F1F]/50 mt-1">
            Explorá los cursos disponibles e inscribite.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-black/5 p-5 shadow-sm animate-pulse h-40"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#050F1F]">
          Mis cursos
        </h1>
        <p className="text-[#050F1F]/50 mt-1">
          Explorá los cursos disponibles e inscribite.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#050F1F]/30 text-sm">
          🔍
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cursos por título..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition"
        />
      </div>

      {courses.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#BAE6FD] p-12 text-center">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-[#050F1F]/50">No hay cursos publicados todavía.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#BAE6FD] p-10 text-center">
          <p className="text-[#050F1F]/50">
            No se encontraron cursos con ese título.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course.id);
            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-black/5 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1A56DB] to-[#38BDF8] flex items-center justify-center text-white font-bold flex-shrink-0 text-lg">
                    {course.title.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#050F1F]">
                        {course.title}
                      </h3>
                      {isEnrolled && (
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                          Inscripto
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#050F1F]/50 mt-1 line-clamp-2">
                      {course.description ?? "Sin descripción"}
                    </p>
                  </div>
                </div>
                <EnrollButton
                  courseId={course.id}
                  courseTitle={course.title}
                  isEnrolled={isEnrolled}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
