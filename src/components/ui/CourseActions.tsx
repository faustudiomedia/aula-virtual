"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { Course } from "@/lib/types";
import { updateCourse, deleteCourse } from "@/app/actions/courses";
import { queryKeys } from "@/lib/hooks/use-data";
import FormError from "./FormError";

// ── Edit Course Form ────────────────────────────────────────────
export function EditCourseForm({
  course,
  onClose,
}: {
  course: Course;
  onClose: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validate(fd: FormData) {
    const errs: Record<string, string> = {};
    if (!(fd.get("title") as string)?.trim())
      errs.title = "El título es requerido";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const errs = validate(fd);
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    startTransition(async () => {
      const result = await updateCourse(course.id, fd);
      if (!result.success) {
        setError(result.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.course(course.id) });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-lg font-bold text-[#050F1F] mb-4">Editar curso</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormError message={error} />
          <div>
            <label className="block text-sm font-medium text-[#050F1F] mb-1.5">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              defaultValue={course.title}
              required
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition ${fieldErrors.title ? "border-red-400 bg-red-50" : "border-black/10"}`}
            />
            {fieldErrors.title && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.title}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#050F1F] mb-1.5">
              Descripción
            </label>
            <textarea
              name="description"
              rows={3}
              defaultValue={course.description ?? ""}
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="published"
              name="published"
              defaultChecked={course.published}
              className="w-4 h-4 rounded accent-[#1A56DB]"
            />
            <label
              htmlFor="published"
              className="text-sm font-medium text-[#050F1F]"
            >
              Publicado
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-[#1A56DB] text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-60"
            >
              {isPending ? "Guardando..." : "Guardar cambios"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-black/10 text-[#050F1F]/70 font-semibold text-sm hover:bg-black/5 transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Course Button ────────────────────────────────────────
export function DeleteCourseButton({
  courseId,
  courseTitle,
}: {
  courseId: string;
  courseTitle: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCourse(courseId);
      if (!result.success) {
        setError(result.error);
        setConfirming(false);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      router.refresh();
    });
  }

  if (confirming) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
          <p className="text-4xl mb-3">🗑️</p>
          <h2 className="text-lg font-bold text-[#050F1F] mb-2">
            ¿Eliminar curso?
          </h2>
          <p className="text-sm text-[#050F1F]/60 mb-4">
            Se eliminará <strong>{courseTitle}</strong> y todos sus materiales.
            Esta acción no se puede deshacer.
          </p>
          <FormError message={error} />
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-60"
            >
              {isPending ? "Eliminando..." : "Sí, eliminar"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="flex-1 py-2.5 rounded-xl border border-black/10 text-[#050F1F]/70 font-semibold text-sm hover:bg-black/5 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium transition-colors border border-red-200"
    >
      Eliminar
    </button>
  );
}

// ─── Edit Course Button (trigger) ───────────────────────────────
export function EditCourseButton({ course }: { course: Course }) {
  const [editing, setEditing] = useState(false);
  return (
    <>
      <button
        onClick={() => setEditing(true)}
        className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium transition-colors border border-amber-200"
      >
        Editar
      </button>
      {editing && (
        <EditCourseForm course={course} onClose={() => setEditing(false)} />
      )}
    </>
  );
}
