"use client";

import { useState } from "react";
import Link from "next/link";
import { useCoursesForInstitute, useEnrollments } from "@/lib/hooks/use-data";
import EnrollButton from "@/components/ui/EnrollButton";

interface Props {
  instituteId: string | null;
  userId: string;
}

const GRADIENTS = [
  ["#1A56DB", "#38BDF8"],
  ["#7C3AED", "#A78BFA"],
  ["#059669", "#34D399"],
  ["#D97706", "#FCD34D"],
  ["#DC2626", "#F87171"],
  ["#0891B2", "#67E8F9"],
  ["#BE185D", "#F9A8D4"],
  ["#92400E", "#FDE68A"],
];

export default function StudentCoursesCatalogView({ instituteId, userId }: Props) {
  const { data: courses = [], isLoading: loadingCourses } = useCoursesForInstitute(instituteId);
  const { data: enrollments = [], isLoading: loadingEnrollments } = useEnrollments(userId);
  const [search, setSearch] = useState("");

  const isLoading = loadingCourses || loadingEnrollments;
  const enrolledCourseIds = new Set(enrollments.map((e) => e.course_id));

  const filtered = search.trim()
    ? courses.filter((c) => c.title.toLowerCase().includes(search.trim().toLowerCase()))
    : courses;

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-[#050F1F] mb-1">Mis cursos</h1>
        <p className="text-[#050F1F]/50 mb-6">Explorá los cursos disponibles e inscribite.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-black/5 shadow-sm animate-pulse overflow-hidden">
              <div className="h-24 bg-gray-200" />
              <div className="p-5 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-[#050F1F] mb-1">Mis cursos</h1>
      <p className="text-[#050F1F]/50 mb-6">Explorá los cursos disponibles e inscribite.</p>

      {/* Search */}
      <div className="relative mb-8">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#050F1F]/30 text-sm">🔍</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cursos por título..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30 transition bg-white"
        />
      </div>

      {courses.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#BAE6FD] p-16 text-center">
          <p className="text-5xl mb-4">📚</p>
          <p className="text-[#050F1F]/50">No hay cursos publicados todavía.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#BAE6FD] p-10 text-center">
          <p className="text-[#050F1F]/50">No se encontraron cursos con ese título.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((course, idx) => {
            const isEnrolled = enrolledCourseIds.has(course.id);
            const [from, to] = GRADIENTS[idx % GRADIENTS.length];

            const card = (
              <div className={`bg-white rounded-2xl overflow-hidden shadow-sm border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                isEnrolled ? "border-green-200 ring-1 ring-green-100" : "border-black/5"
              }`}>
                {/* Cover strip */}
                <div
                  className="h-24 flex items-center justify-center relative"
                  style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                >
                  <span className="text-4xl font-bold text-white/90 select-none">
                    {course.title.charAt(0).toUpperCase()}
                  </span>
                  {isEnrolled && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-[#050F1F] leading-snug line-clamp-1">
                      {course.title}
                    </h3>
                    {isEnrolled && (
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium whitespace-nowrap flex-shrink-0">
                        Inscripto
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#050F1F]/50 line-clamp-2 mb-4 min-h-[2.5rem]">
                    {course.description ?? "Sin descripción"}
                  </p>

                  {isEnrolled ? (
                    <div
                      className="w-full py-2.5 rounded-xl text-white text-sm font-semibold text-center shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                    >
                      Ir al curso →
                    </div>
                  ) : (
                    <EnrollButton
                      courseId={course.id}
                      courseTitle={course.title}
                      isEnrolled={false}
                    />
                  )}
                </div>
              </div>
            );

            return isEnrolled ? (
              <Link key={course.id} href={`/dashboard/student/courses/${course.id}`} className="block">
                {card}
              </Link>
            ) : (
              <div key={course.id}>{card}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
