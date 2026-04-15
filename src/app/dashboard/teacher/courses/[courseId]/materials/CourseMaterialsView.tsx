"use client";

import { useTransition, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCourse, useCourseMaterials, queryKeys } from "@/lib/hooks/use-data";
import { addMaterial } from "@/app/actions/courses";
import SubmitButton from "@/components/ui/SubmitButton";
import FormError from "@/components/ui/FormError";
import {
  EditMaterialButton,
  DeleteMaterialButton,
} from "@/components/ui/MaterialActions";
import { useState } from "react";

interface Props {
  courseId: string;
}

export default function CourseMaterialsView({ courseId }: Props) {
  const queryClient = useQueryClient();
  const { data: course, isLoading: loadingCourse } = useCourse(courseId);
  const { data: materials = [], isLoading: loadingMaterials } =
    useCourseMaterials(courseId);

  const [_isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleAddMaterial(formData: FormData) {
    setFormError(null);
    startTransition(async () => {
      const result = await addMaterial(courseId, formData);
      if (!result.success) {
        setFormError(result.error);
        return;
      }
      formRef.current?.reset();
      queryClient.invalidateQueries({
        queryKey: queryKeys.courseMaterials(courseId),
      });
    });
  }

  if (loadingCourse || loadingMaterials) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="h-48 bg-white rounded-2xl border border-black/5 shadow-sm" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-white rounded-xl border border-black/5 shadow-sm"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <p className="text-[#050F1F]/50">Curso no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <a
          href="/dashboard/teacher"
          className="text-[#1A56DB] hover:underline text-sm"
        >
          ← Mis cursos
        </a>
      </div>
      <h1 className="text-2xl font-bold text-[#050F1F] mb-1">{course.title}</h1>
      <p className="text-[#050F1F]/50 mb-8">Materiales del curso</p>

      {/* Add material form */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 mb-6">
        <h2 className="text-sm font-semibold text-[#050F1F] mb-4">
          Agregar material
        </h2>
        <FormError message={formError} />
        <form ref={formRef} action={handleAddMaterial} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              name="title"
              required
              placeholder="Título *"
              className="px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
            />
            <select
              name="file_type"
              className="px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] bg-white"
            >
              <option value="">Tipo de archivo</option>
              <option value="pdf">PDF</option>
              <option value="video">Video</option>
              <option value="link">Enlace</option>
              <option value="image">Imagen</option>
            </select>
          </div>
          <input
            name="description"
            placeholder="Descripción (opcional)"
            className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
          />
          <div className="flex gap-3">
            <input
              name="file_url"
              placeholder="URL del archivo o enlace"
              className="flex-1 px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
            />
            <input
              name="order_index"
              type="number"
              min="0"
              defaultValue={materials.length}
              placeholder="Orden"
              className="w-24 px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
            />
          </div>
          <SubmitButton
            label="Agregar"
            loadingLabel="Agregando..."
            className="px-5 py-2 rounded-lg"
          />
        </form>
      </div>

      {/* Materials list */}
      {materials.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#BAE6FD] p-10 text-center">
          <p className="text-[#050F1F]/50">
            Este curso aún no tiene materiales.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((m, idx) => (
            <div
              key={m.id}
              className="bg-white rounded-xl border border-black/5 p-4 flex items-center gap-4 shadow-sm"
            >
              <span className="w-8 h-8 rounded-lg bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center text-xs font-bold text-[#1A56DB] flex-shrink-0">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#050F1F] text-sm">{m.title}</p>
                {m.description && (
                  <p className="text-xs text-[#050F1F]/50 mt-0.5">
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
              <div className="flex gap-1 flex-shrink-0">
                <EditMaterialButton material={m} />
                <DeleteMaterialButton
                  materialId={m.id}
                  materialTitle={m.title}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
