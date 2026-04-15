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
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-[#050F1F] mb-2">
        Todos los materiales
      </h1>
      <p className="text-[#050F1F]/50 mb-8">
        Materiales cargados en todos tus cursos.
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
