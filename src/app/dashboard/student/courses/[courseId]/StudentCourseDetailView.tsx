"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCourseMaterials, useMaterialCompletions } from "@/lib/hooks/use-data";
import { toggleMaterialCompletion } from "@/app/actions/courses";
import ProgressBar from "@/components/ui/ProgressBar";
import { StudentCourseNavTabs } from "@/components/ui/StudentCourseNavTabs";
import type { Course } from "@/lib/types";

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

function MaterialIcon({ fileType }: { fileType: string | null }) {
  if (fileType === "video") return <span className="text-lg">🎬</span>;
  if (fileType === "pdf") return <span className="text-lg">📄</span>;
  return <span className="text-lg">🔗</span>;
}

export default function StudentCourseDetailView({ course, enrollment, userId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [localProgress, setLocalProgress] = useState(enrollment.progress);
  const [localCompleted, setLocalCompleted] = useState(enrollment.completed);
  const [pendingMaterialId, setPendingMaterialId] = useState<string | null>(null);

  const { data: materials = [], isLoading: loadingMaterials } = useCourseMaterials(course.id);
  const { data: completed = new Set<string>(), isLoading: loadingCompletions } =
    useMaterialCompletions(course.id, userId);

  const isLoading = loadingMaterials || loadingCompletions;

  function handleToggle(materialId: string) {
    setPendingMaterialId(materialId);
    startTransition(async () => {
      const result = await toggleMaterialCompletion(materialId, course.id);
      if (result.success) {
        // Optimistically update local progress
        const nextCompleted = new Set(completed);
        if (result.nowCompleted) {
          nextCompleted.add(materialId);
        } else {
          nextCompleted.delete(materialId);
        }
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
    <div className="p-8 max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/dashboard/student/courses"
        className="inline-flex items-center gap-1.5 text-sm text-[#050F1F]/50 hover:text-[#1A56DB] transition mb-6"
      >
        ← Volver a mis cursos
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1A56DB] to-[#38BDF8] flex-shrink-0 flex items-center justify-center text-white text-xl font-bold">
            {course.title.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-[#050F1F]">{course.title}</h1>
              {localCompleted && (
                <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                  Completado
                </span>
              )}
            </div>
            {course.description && (
              <p className="text-sm text-[#050F1F]/60 mb-4">{course.description}</p>
            )}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <ProgressBar value={localProgress} />
              </div>
              <span className="text-xs text-[#050F1F]/50 flex-shrink-0">
                {completed.size}/{materials.length} materiales
              </span>
            </div>
          </div>
        </div>
      </div>

      <StudentCourseNavTabs courseId={course.id} />

      {/* Materials */}
      <h2 className="text-base font-semibold text-[#050F1F] mb-3">Contenido del curso</h2>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-black/5 p-4 animate-pulse h-20"
            />
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#BAE6FD] p-10 text-center">
          <p className="text-[#050F1F]/50 text-sm">
            Este curso todavía no tiene materiales cargados.
          </p>
        </div>
      ) : (
        <ol className="space-y-3">
          {materials.map((material, index) => {
            const isDone = completed.has(material.id);
            const isThisPending = isPending && pendingMaterialId === material.id;

            return (
              <li
                key={material.id}
                className={`bg-white rounded-2xl border transition-all ${
                  isDone ? "border-green-200 bg-green-50/30" : "border-black/5"
                } shadow-sm p-4`}
              >
                <div className="flex items-start gap-4">
                  {/* Index / check */}
                  <div
                    className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold transition-colors ${
                      isDone
                        ? "bg-green-500 text-white"
                        : "bg-[#EFF6FF] text-[#1A56DB]"
                    }`}
                  >
                    {isDone ? "✓" : index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <MaterialIcon fileType={material.file_type} />
                      <span className="font-semibold text-[#050F1F] text-sm">
                        {material.title}
                      </span>
                    </div>
                    {material.description && (
                      <p className="text-xs text-[#050F1F]/50 mb-2">{material.description}</p>
                    )}
                    {material.file_url && (
                      <a
                        href={material.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#1A56DB] hover:underline"
                      >
                        Abrir material →
                      </a>
                    )}
                  </div>

                  {/* Toggle button */}
                  <button
                    onClick={() => handleToggle(material.id)}
                    disabled={isThisPending}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition disabled:opacity-50 ${
                      isDone
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-[#EFF6FF] text-[#1A56DB] hover:bg-[#DBEAFE]"
                    }`}
                  >
                    {isThisPending ? "..." : isDone ? "Marcar pendiente" : "Marcar como visto"}
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
