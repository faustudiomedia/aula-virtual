"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { enrollInCourse, unenrollFromCourse } from "@/app/actions/courses";
import { queryKeys } from "@/lib/hooks/use-data";
import FormError from "./FormError";

interface EnrollButtonProps {
  courseId: string;
  courseTitle: string;
  isEnrolled: boolean;
}

export default function EnrollButton({
  courseId,
  courseTitle,
  isEnrolled,
}: EnrollButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmUnenroll, setConfirmUnenroll] = useState(false);

  function handleEnroll() {
    setError(null);
    startTransition(async () => {
      const result = await enrollInCourse(courseId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments(courseId) });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      router.refresh();
    });
  }

  function handleUnenroll() {
    setError(null);
    startTransition(async () => {
      const result = await unenrollFromCourse(courseId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      router.refresh();
      setConfirmUnenroll(false);
    });
  }

  if (confirmUnenroll) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
          <p className="text-4xl mb-3">📤</p>
          <h2 className="text-lg font-bold text-[var(--ag-text)] mb-2">
            ¿Desinscribirse?
          </h2>
          <p className="text-sm text-[var(--ag-text-muted)] mb-4">
            Se perderá tu progreso en <strong>{courseTitle}</strong>.
          </p>
          <FormError message={error} />
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleUnenroll}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-60"
            >
              {isPending ? "Procesando..." : "Sí, salir"}
            </button>
            <button
              onClick={() => setConfirmUnenroll(false)}
              className="flex-1 py-2.5 rounded-xl border border-black/10 text-[var(--ag-text)]/70 font-semibold text-sm hover:bg-black/5 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <FormError message={error} />
      {isEnrolled ? (
        <button
          onClick={() => setConfirmUnenroll(true)}
          className="w-full py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition"
        >
          Desinscribirse
        </button>
      ) : (
        <button
          onClick={handleEnroll}
          disabled={isPending}
          className="w-full py-2.5 rounded-xl bg-[var(--ag-navy)] text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-60 shadow-lg "
        >
          {isPending ? "Inscribiendo..." : "Inscribirse al curso"}
        </button>
      )}
    </div>
  );
}
