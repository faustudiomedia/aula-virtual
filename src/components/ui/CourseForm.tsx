'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createCourse, type ActionState } from '@/app/actions/courses'
import SubmitButton from '@/components/ui/SubmitButton'

export default function CourseForm() {
  const initialState: ActionState = {}
  const [state, formAction] = useActionState(createCourse, initialState)
  const router = useRouter()

  useEffect(() => {
    if (state.success) {
      toast.success('¡Curso creado exitosamente!')
      router.push('/dashboard/teacher')
      router.refresh()
    } else if (state.error) {
      toast.error(state.error)
    }
  }, [state, router])

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
          Título del curso <span className="text-red-500">*</span>
        </label>
        <input name="title" placeholder="Ej: Inglés Nivel A2"
          className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-[var(--ag-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 focus:border-transparent transition-all" />
        {state.fieldErrors?.title && (
          <p className="mt-1 text-sm text-red-500">{state.fieldErrors.title[0]}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">Descripción</label>
        <textarea name="description" rows={4} placeholder="Describí brevemente de qué trata el curso..."
          className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-[var(--ag-text)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 focus:border-transparent transition-all" />
        {state.fieldErrors?.description && (
          <p className="mt-1 text-sm text-red-500">{state.fieldErrors.description[0]}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">Horario de cátedra</label>
        <input name="schedule" placeholder="Ej: Lunes y Miércoles 18:00 - 20:00"
          className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-[var(--ag-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 focus:border-transparent transition-all" />
        <p className="text-xs text-[var(--ag-text-muted)] mt-1">Opcional. Días y horarios de la materia.</p>
      </div>

      <div className="flex items-center gap-3">
        <input type="checkbox" id="published" name="published" className="w-4 h-4 rounded accent-[var(--ag-navy)]" />
        <label htmlFor="published" className="text-sm font-medium text-[var(--ag-text)]">Publicar inmediatamente</label>
      </div>

      <div className="flex gap-3 pt-2">
        <SubmitButton label="Crear curso" loadingLabel="Creando..." />
        <a href="/dashboard/teacher"
          className="flex-1 py-2.5 flex items-center justify-center rounded-xl border border-black/10 text-[var(--ag-text)]/70 font-semibold text-sm text-center hover:bg-black/5 transition-all">
          Cancelar
        </a>
      </div>
    </form>
  )
}
