"use client";

import Link from "next/link";
import { useTeacherCourses } from "@/lib/hooks/use-data";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Course, Material } from "@/lib/types";
import { FileText, Video, Image, Link2, Plus, ArrowRight } from "lucide-react";

interface Props {
  teacherId: string;
}

const ACCENT_COLORS = [
  "var(--ag-navy)",
  "#2D6A4F",
  "#6B3FA0",
  "#1D6F8E",
  "#8B4513",
  "#1A5F4A",
];

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { Icon: React.ElementType; label: string }> = {
    pdf:   { Icon: FileText, label: "pdf" },
    video: { Icon: Video,    label: "video" },
    image: { Icon: Image,    label: "imagen" },
    link:  { Icon: Link2,    label: "link" },
  };
  const entry = map[type] ?? { Icon: Link2, label: type };
  const { Icon, label } = entry;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0"
      style={{
        background: "rgba(30,58,95,0.07)",
        color: "var(--ag-navy)",
        border: "1px solid rgba(30,58,95,0.12)",
      }}
    >
      <Icon size={10} />
      {label}
    </span>
  );
}

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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--ag-text)" }}>
          Materiales
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--ag-text-muted)" }}>
          {totalMaterials} material{totalMaterials !== 1 ? "es" : ""} en{" "}
          {courses.length} curso{courses.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="space-y-8">
        {isLoading ? (
          [...Array(2)].map((_, si) => (
            <div key={si}>
              <div className="skeleton-shimmer h-5 w-48 rounded mb-3" />
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton-shimmer rounded-xl h-14" />
                ))}
              </div>
            </div>
          ))
        ) : courses.length === 0 ? (
          <div
            className="rounded-xl p-10 text-center bg-white"
            style={{ border: "2px dashed var(--ag-border-light)" }}
          >
            <p className="text-sm mb-3" style={{ color: "var(--ag-text-muted)" }}>
              Todavia no creaste ningun curso.
            </p>
            <Link
              href="/dashboard/teacher/courses/new"
              className="text-sm font-medium"
              style={{ color: "var(--ag-navy)" }}
            >
              Crear curso &rarr;
            </Link>
          </div>
        ) : (
          courses.map((course: Course, ci: number) => {
            const courseMaterials = materials.filter(
              (m: Material) => m.course_id === course.id
            );
            const accent = ACCENT_COLORS[ci % ACCENT_COLORS.length];
            return (
              <div key={course.id}>
                {/* Course header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: accent }}
                    >
                      {course.title.charAt(0).toUpperCase()}
                    </div>
                    <h2
                      className="text-base font-semibold"
                      style={{ color: "var(--ag-text)" }}
                    >
                      {course.title}
                    </h2>
                    <span
                      className="text-xs"
                      style={{ color: "var(--ag-text-muted)" }}
                    >
                      ({courseMaterials.length})
                    </span>
                  </div>
                  <Link
                    href={`/dashboard/teacher/courses/${course.id}/materials`}
                    className="inline-flex items-center gap-1 text-xs font-medium flex-shrink-0"
                    style={{ color: "var(--ag-navy)" }}
                  >
                    <Plus size={12} />
                    Agregar material
                  </Link>
                </div>

                {courseMaterials.length === 0 ? (
                  <div
                    className="rounded-xl px-5 py-4 text-sm"
                    style={{
                      border: "1px dashed var(--ag-border-light)",
                      color: "var(--ag-text-muted)",
                    }}
                  >
                    Este curso no tiene materiales aun.
                  </div>
                ) : (
                  <div
                    className="bg-white rounded-xl overflow-hidden"
                    style={{
                      border: "1px solid var(--ag-border-light)",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                    }}
                  >
                    {courseMaterials.map((m: Material, idx: number) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-4 px-4 py-3"
                        style={{
                          borderBottom:
                            idx < courseMaterials.length - 1
                              ? "1px solid var(--ag-border-light)"
                              : "none",
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-medium text-sm"
                            style={{ color: "var(--ag-text)" }}
                          >
                            {m.title}
                          </p>
                          {m.description && (
                            <p
                              className="text-xs mt-0.5 truncate"
                              style={{ color: "var(--ag-text-muted)" }}
                            >
                              {m.description}
                            </p>
                          )}
                        </div>
                        {m.file_type && <TypeBadge type={m.file_type} />}
                        {m.file_url && (
                          <a
                            href={m.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium flex-shrink-0 transition-opacity hover:opacity-70"
                            style={{ color: "var(--ag-navy)" }}
                          >
                            Ver <ArrowRight size={12} />
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
