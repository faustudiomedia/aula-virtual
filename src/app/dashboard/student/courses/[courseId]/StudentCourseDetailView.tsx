"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCourseMaterials, useMaterialCompletions } from "@/lib/hooks/use-data";
import { toggleMaterialCompletion } from "@/app/actions/courses";
import ProgressBar from "@/components/ui/ProgressBar";
import { StudentCourseNavTabs } from "@/components/ui/StudentCourseNavTabs";
import type { Course, Material } from "@/lib/types";

interface Enrollment {
  id: string;
  progress: number;
  completed: boolean;
}

interface Props {
  course: Course;
  enrollment: Enrollment;
  userId: string;
}

const FILE_ICONS: Record<string, string> = {
  video: "🎬",
  pdf: "📄",
  link: "🔗",
  image: "🖼️",
};

const FILE_LABELS: Record<string, string> = {
  video: "VIDEO",
  pdf: "PDF",
  link: "ENLACE",
  image: "IMAGEN",
};

export default function StudentCourseDetailView({ course, enrollment, userId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [localProgress, setLocalProgress] = useState(enrollment.progress);
  const [localCompleted, setLocalCompleted] = useState(enrollment.completed);
  const [pendingMaterialId, setPendingMaterialId] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<number | null>(null);

  const { data: materials = [], isLoading: loadingMaterials } = useCourseMaterials(course.id);
  const { data: completed = new Set<string>(), isLoading: loadingCompletions } =
    useMaterialCompletions(course.id, userId);

  const isLoading = loadingMaterials || loadingCompletions;

  // Group materials by module_number; null/0 → key 0 (shown as "General")
  const moduleGroups = useMemo(() => {
    const map = new Map<number, { title: string | null; materials: Material[] }>();
    materials.forEach((m: Material) => {
      const key = m.module_number ?? 0;
      if (!map.has(key)) {
        map.set(key, { title: m.module_title ?? null, materials: [] });
      }
      map.get(key)!.materials.push(m);
    });
    // Sort: numbered modules ascending, then "General" (0) at end
    return [...map.entries()].sort(([a], [b]) => {
      if (a === 0) return 1;
      if (b === 0) return -1;
      return a - b;
    });
  }, [materials]);

  const hasModules = moduleGroups.some(([k]) => k !== 0);
  const firstKey = moduleGroups[0]?.[0] ?? 0;
  const currentModule = activeModule ?? firstKey;
  const currentGroup = moduleGroups.find(([k]) => k === currentModule)?.[1];
  const currentMaterials = currentGroup?.materials ?? materials;

  function handleToggle(materialId: string) {
    setPendingMaterialId(materialId);
    startTransition(async () => {
      const result = await toggleMaterialCompletion(materialId, course.id);
      if (result.success) {
        const nextCompleted = new Set(completed);
        if (result.nowCompleted) nextCompleted.add(materialId);
        else nextCompleted.delete(materialId);
        const total = materials.length;
        const done = nextCompleted.size;
        const newProgress = total > 0 ? Math.round((done / total) * 100) : 0;
        setLocalProgress(newProgress);
        setLocalCompleted(newProgress >= 100);
        queryClient.invalidateQueries({ queryKey: ["material_completions", course.id, userId] });
        queryClient.invalidateQueries({ queryKey: ["enrollments"] });
        router.refresh();
      }
      setPendingMaterialId(null);
    });
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Course hero */}
      <div
        className="relative h-40 md:h-52 flex items-end bg-gradient-to-br from-[#1A56DB] to-[#38BDF8] overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }}
        />
        <div className="relative z-10 p-6 md:p-8 w-full">
          <Link
            href="/dashboard/student/courses"
            className="inline-flex items-center gap-1 text-white/70 hover:text-white text-xs mb-3 transition-colors"
          >
            ← Mis cursos
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
            {course.title}
          </h1>
          {course.description && (
            <p className="text-white/70 text-sm mt-1 line-clamp-1">{course.description}</p>
          )}
        </div>
      </div>

      {/* Progress bar + stats */}
      <div className="bg-white border-b border-black/5 px-6 md:px-8 py-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <ProgressBar value={localProgress} />
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs text-[#050F1F]/50">
              {completed.size}/{materials.length} materiales
            </span>
            {localCompleted && (
              <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                ✓ Completado
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8">
        <StudentCourseNavTabs courseId={course.id} />

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-black/5 p-6 animate-pulse h-40" />
            ))}
          </div>
        ) : materials.length === 0 ? (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-[#BAE6FD] p-10 text-center">
            <p className="text-[#050F1F]/50 text-sm">
              Este curso todavía no tiene materiales cargados.
            </p>
          </div>
        ) : (
          <>
            {/* Module tabs — only shown when there are named modules */}
            {hasModules && (
              <div className="flex items-center gap-2 mt-4 mb-6 overflow-x-auto pb-1 scrollbar-none">
                {moduleGroups.map(([key, group]) => {
                  const isActive = currentModule === key;
                  const label = key === 0 ? "General" : `M${key}`;
                  const moduleCompleted = group.materials.every(m => completed.has(m.id));
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveModule(key)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                        isActive
                          ? "bg-[#1A56DB] text-white shadow-lg shadow-[#1A56DB]/20"
                          : "bg-white border border-black/10 text-[#050F1F]/60 hover:border-[#1A56DB]/30 hover:text-[#1A56DB]"
                      }`}
                    >
                      {label}
                      {moduleCompleted && group.materials.length > 0 && (
                        <span className={`text-[10px] ${isActive ? "text-white/70" : "text-green-500"}`}>✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Module title */}
            {hasModules && currentModule !== 0 && (
              <div className="mb-5">
                <h2 className="text-lg font-bold text-[#050F1F]">
                  Módulo {currentModule}
                  {currentGroup?.title && (
                    <span className="text-[#050F1F]/50 font-normal ml-2">— {currentGroup.title}</span>
                  )}
                </h2>
                <p className="text-sm text-[#050F1F]/40 mt-0.5">
                  {currentGroup?.materials.filter(m => completed.has(m.id)).length ?? 0} / {currentGroup?.materials.length ?? 0} completados
                </p>
              </div>
            )}

            {/* Materials grid */}
            <div className={`grid gap-4 ${hasModules ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
              {currentMaterials.map((material, idx) => {
                const isDone = completed.has(material.id);
                const isThisPending = isPending && pendingMaterialId === material.id;

                return (
                  <div
                    key={material.id}
                    className={`bg-white rounded-2xl border shadow-sm transition-all hover:shadow-md ${
                      isDone ? "border-green-200" : "border-black/5"
                    }`}
                  >
                    <div className="p-5">
                      {/* Number + badge */}
                      <div className="flex items-start justify-between mb-3">
                        <span className={`text-4xl font-black leading-none ${isDone ? "text-green-400" : "text-[#1A56DB]/15"}`}>
                          {isDone ? "✓" : String(idx + 1).padStart(2, "0")}
                        </span>
                        {material.file_type && (
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                            isDone
                              ? "bg-green-50 text-green-600"
                              : "bg-[#EFF6FF] text-[#1A56DB]"
                          }`}>
                            {FILE_ICONS[material.file_type] ?? "📎"} {FILE_LABELS[material.file_type] ?? material.file_type.toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Title + description */}
                      <h3 className="font-bold text-[#050F1F] text-sm leading-snug mb-1">
                        {material.title}
                      </h3>
                      {material.description && (
                        <p className="text-xs text-[#050F1F]/50 line-clamp-2 mb-3">
                          {material.description}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-black/5">
                        {material.file_url ? (
                          <a
                            href={material.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#1A56DB] hover:underline font-medium"
                          >
                            ver más →
                          </a>
                        ) : (
                          <span />
                        )}
                        <button
                          onClick={() => handleToggle(material.id)}
                          disabled={isThisPending}
                          className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition disabled:opacity-50 ${
                            isDone
                              ? "bg-green-50 text-green-700 hover:bg-green-100"
                              : "bg-[#EFF6FF] text-[#1A56DB] hover:bg-[#DBEAFE]"
                          }`}
                        >
                          {isThisPending ? "..." : isDone ? "✓ Visto" : "Marcar visto"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom module navigation */}
            {hasModules && moduleGroups.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-black/5">
                {moduleGroups.map(([key], i) => {
                  const isActive = currentModule === key;
                  const prev = moduleGroups[i - 1];
                  const next = moduleGroups[i + 1];
                  void prev; void next;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveModule(key)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? "bg-[#1A56DB] text-white shadow-md"
                          : "bg-black/5 text-[#050F1F]/40 hover:bg-[#EFF6FF] hover:text-[#1A56DB]"
                      }`}
                    >
                      {key === 0 ? "G" : `M${key}`}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
