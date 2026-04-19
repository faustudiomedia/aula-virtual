"use client";

import Link from "next/link";
import { useTeacherCourses } from "@/lib/hooks/use-data";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Course, Material } from "@/lib/types";

interface Props {
  teacherId: string;
}

const fileIcon: Record<string, string> = {
  pdf:   "📄",
  video: "🎥",
  image: "🖼️",
  link:  "🔗",
};

export default function AllMaterialsView({ teacherId }: Props) {
  const { data: courses = [], isLoading: loadingCourses } =
    useTeacherCourses(teacherId);

  const courseIds = courses.map((c: Course) => c.id);

  const { data: materials = [], isLoading: loadingMaterials } = useQuery({
    queryKey: ["materials", "teacher", teacherId, courseIds],
    queryFn: async () => {
      if (!courseIds.length) return [] as Material[];
      const supabase = createClient();
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .in("course_id", courseIds)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Material[];
    },
    enabled: courseIds.length > 0,
  });

  const isLoading = loadingCourses || (courseIds.length > 0 && loadingMaterials);

  const totalMaterials = materials.length;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h1 className="text-2xl font-bold text-[#050F1F]">Materiales</h1>
          <p className="text-[#050F1F]/50 mt-1">
            {totalMaterials} material{totalMaterials !== 1 ? "es" : ""} en {courses.length} curso{courses.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {isLoading ? (
          [...Array(2)].map((_, si) => (
            <div key={si}>
              <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-3" />
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl border border-black/5 p-4 shadow-sm animate-pulse h-16"
                  />
                ))}
              </div>
            </div>
          ))
        ) : courses.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#BAE6FD] p-10 text-center">
            <p className="text-[#050F1F]/50">Todavía no creaste ningún curso.</p>
            <Link
              href="/dashboard/teacher/courses/new"
              className="mt-4 inline-block text-sm text-[#1A56DB] hover:underline"
            >
              Crear curso →
            </Link>
          </div>
        ) : (
          courses.map((course: Course) => {
            const courseMaterials = materials.filter(
              (m: Material) => m.course_id === course.id
            );
            return (
              <div key={course.id}>
                {/* Course header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1A56DB] to-[#38BDF8] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {course.title.charAt(0)}
                    </div>
                    <h2 className="text-base font-semibold text-[#050F1F]">
                      {course.title}
                    </h2>
                    <span className="text-xs text-[#050F1F]/40">
                      ({courseMaterials.length})
                    </span>
                  </div>
                  <Link
                    href={`/dashboard/teacher/courses/${course.id}/materials`}
                    className="text-xs text-[#1A56DB] hover:underline flex-shrink-0"
                  >
                    + Agregar material
                  </Link>
                </div>

                {courseMaterials.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#BAE6FD] px-5 py-4 text-sm text-[#050F1F]/40">
                    Este curso no tiene materiales aún.
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
                    {courseMaterials.map((m: Material, idx: number) => (
                      <div
                        key={m.id}
                        className={`flex items-center gap-4 px-5 py-3.5 ${
                          idx < courseMaterials.length - 1
                            ? "border-b border-black/5"
                            : ""
                        }`}
                      >
                        <span className="text-xl flex-shrink-0">
                          {fileIcon[m.file_type ?? ""] ?? "🔗"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#050F1F] text-sm">
                            {m.title}
                          </p>
                          {m.description && (
                            <p className="text-xs text-[#050F1F]/40 mt-0.5 truncate">
                              {m.description}
                            </p>
                          )}
                        </div>
                        {m.file_type && (
                          <span className="px-2 py-0.5 rounded-full bg-[#F0F9FF] border border-[#BAE6FD] text-[#1A56DB] text-xs font-medium flex-shrink-0">
                            {m.file_type}
                          </span>
                        )}
                        {m.file_url && (
                          <a
                            href={m.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#1A56DB] hover:underline text-xs flex-shrink-0"
                          >
                            Ver →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
