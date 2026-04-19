'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { enrollInCourse, unenrollFromCourse } from '@/app/actions/courses'
import FormError from './FormError'

// ── Modal de confirmación de desinscripción ───────────────────────
function UnenrollModal({
  courseTitle,
  isPending,
  error,
  onConfirm,
  onCancel,
}: {
  courseTitle: string
  isPending: boolean
  error: string | null
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <p className="text-4xl mb-3">📤</p>
        <h2 className="text-lg font-bold text-[#050F1F] mb-2">¿Desinscribirse?</h2>
        <p className="text-sm text-[#050F1F]/60 mb-4">
          Se perderá tu progreso en <strong>{courseTitle}</strong>.
        </p>
        <FormError message={error} />
        <div className="flex gap-3 mt-4">
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-60"
          >
            {isPending ? 'Procesando...' : 'Sí, salir'}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-black/10 text-[#050F1F]/70 font-semibold text-sm hover:bg-black/5 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── EnrollButton — usado en el catálogo ──────────────────────────
interface EnrollButtonProps {
  courseId: string
  courseTitle: string
  isEnrolled: boolean
}

export default function EnrollButton({ courseId, courseTitle, isEnrolled }: EnrollButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmUnenroll, setConfirmUnenroll] = useState(false)

  function handleEnroll() {
    setError(null)
    startTransition(async () => {
      const result = await enrollInCourse(courseId)
      if (!result.success) { setError(result.error ?? 'Error al inscribirse'); return }
      router.refresh()
    })
  }

  function handleUnenroll() {
    setError(null)
    startTransition(async () => {
      const result = await unenrollFromCourse(courseId)
      if (!result.success) { setError(result.error ?? 'Error al desinscribirse'); return }
      router.refresh()
      setConfirmUnenroll(false)
    })
  }

  return (
    <>
      {confirmUnenroll && (
        <UnenrollModal
          courseTitle={courseTitle}
          isPending={isPending}
          error={error}
          onConfirm={handleUnenroll}
          onCancel={() => setConfirmUnenroll(false)}
        />
      )}
      <div className="space-y-2">
        <FormError message={!confirmUnenroll ? error : null} />
        {isEnrolled ? (
          <div className="flex gap-2">
            <Link
              href={`/dashboard/student/courses/${courseId}`}
              className="flex-1 py-2.5 rounded-xl bg-[#059669] text-white font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-[#059669]/20 text-center"
            >
              Ir al curso
            </Link>
            <button
              onClick={() => setConfirmUnenroll(true)}
              className="px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition flex items-center justify-center"
              title="Desinscribirse"
            >
              Salir
            </button>
          </div>
        ) : (
          <button
            onClick={handleEnroll}
            disabled={isPending}
            className="w-full py-2.5 rounded-xl bg-[#1A56DB] text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-60 shadow-lg shadow-[#1A56DB]/20"
          >
            {isPending ? 'Inscribiendo...' : 'Inscribirse al curso'}
          </button>
        )}
      </div>
    </>
  )
}

// ── UnenrollButton — usado en la vista de detalle del curso ──────
export function UnenrollButton({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)

  function handleUnenroll() {
    setError(null)
    startTransition(async () => {
      const result = await unenrollFromCourse(courseId)
      if (!result.success) { setError(result.error ?? 'Error al desinscribirse'); return }
      router.replace('/dashboard/student/courses')
    })
  }

  return (
    <>
      {confirm && (
        <UnenrollModal
          courseTitle={courseTitle}
          isPending={isPending}
          error={error}
          onConfirm={handleUnenroll}
          onCancel={() => setConfirm(false)}
        />
      )}
      <button
        onClick={() => setConfirm(true)}
        className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition"
      >
        Salir del curso
      </button>
    </>
  )
}