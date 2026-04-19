"use client";

import Link from "next/link";
import { useTeacherCourses } from "@/lib/hooks/use-data";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Material } from "@/lib/types";

interface Props {
  teacherId: string;
}

export default function AllMaterialsView({ teacherId }: Props) {
  const { data: courses = [], isLoading: loadingCourses } =
    useTeacherCourses(teacherId);

  const courseIds = courses.map((c) => c.id);
  const courseMap: Record<string, string> = {};
  courses.forEach((c) => {
    courseMap[c.id] = c.title;
  });

  const { data: materials = [], isLoading: loadingMaterials } = useQuery({
    queryKey: ["materials", "teacher", teacherId, courseIds],
    queryFn: async () => {
      if (!courseIds.length) return [] as Material[];
      const supabase = createClient();
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .in("course_id", courseIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Material[];
    },
    enabled: courseIds.length > 0,
  });

  const isLoading =
    loadingCourses || (courseIds.length > 0 && loadingMaterials);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-2">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h1 className="text-2xl font-bold text-[#050F1F]">
            Todos los materiales
          </h1>
        </div>
        {courses.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-2">
            <span className="text-sm text-[#050F1F]/50 flex-shrink-0">Agregar en:</span>
            <div className="flex gap-2 flex-wrap">
              {courses.slice(0, 4).map((c) => (
                <Link
                  key={c.id}
                  href={`/dashboard/teacher/courses/${c.id}/materials`}
                  className="px-3 py-1.5 rounded-lg bg-[#EFF6FF] text-[#1A56DB] text-xs font-medium hover:bg-[#DBEAFE] transition"
                >
                  + {c.title.length > 20 ? c.title.slice(0, 20) + "…" : c.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <p className="text-[#050F1F]/50 mb-8">
        Materiales cargados en todos tus cursos. Para agregar, seleccioná un curso arriba.
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-black/5 p-4 shadow-sm animate-pulse h-16"
            />
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#BAE6FD] p-10 text-center">
          <p className="text-[#050F1F]/50">Todavía no cargaste materiales.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-xl border border-black/5 p-4 flex items-center gap-4 shadow-sm"
            >
              <span className="text-2xl">
                {m.file_type === "pdf"
                  ? "📄"
                  : m.file_type === "video"
                    ? "🎥"
                    : m.file_type === "image"
                      ? "🖼️"
                      : "🔗"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#050F1F] text-sm">{m.title}</p>
                <p className="text-xs text-[#050F1F]/40 mt-0.5">
                  Curso: {courseMap[m.course_id] ?? "Desconocido"}
                </p>
              </div>
              <Link
                href={`/dashboard/teacher/courses/${m.course_id}/materials`}
                className="text-[#1A56DB] hover:underline text-xs"
              >
                Ver curso →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
