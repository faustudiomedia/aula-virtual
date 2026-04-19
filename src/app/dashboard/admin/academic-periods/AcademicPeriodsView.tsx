'use client'

import { useActionState, useTransition } from 'react'
import { createAcademicPeriod, toggleAcademicPeriod, deleteAcademicPeriod } from '@/app/actions/academic-periods'

interface Period {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
}

interface Props {
  periods: Period[]
}

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AcademicPeriodsView({ periods }: Props) {
  const [state, formAction, pending] = useActionState(createAcademicPeriod, {})
  const [, startTransition] = useTransition()

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      await toggleAcademicPeriod(id, !current)
    })
  }

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar este periodo? Los cursos vinculados perderán la referencia.')) return
    startTransition(async () => {
      await deleteAcademicPeriod(id)
    })
  }

  return (
    <div className="space-y-8">
      {/* Create form */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
        <h2 className="text-base font-semibold text-[#050F1F] mb-4">Nuevo periodo</h2>
        <form action={formAction} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#050F1F]/60 mb-1">Nombre</label>
            <input
              name="name"
              required
              placeholder="Ej: 1er Cuatrimestre 2026"
              className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#050F1F]/60 mb-1">Inicio</label>
            <input
              name="start_date"
              type="date"
              required
              className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#050F1F]/60 mb-1">Fin</label>
            <input
              name="end_date"
              type="date"
              required
              className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30"
            />
          </div>
          {state?.error && (
            <p className="md:col-span-3 text-xs text-red-600">{state.error}</p>
          )}
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2 rounded-lg bg-[#1A56DB] text-white text-sm font-medium hover:bg-[#1A56DB]/90 disabled:opacity-50 transition-colors"
            >
              {pending ? 'Guardando...' : 'Crear periodo'}
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        {periods.length === 0 ? (
          <p className="p-6 text-sm text-[#050F1F]/40 text-center">No hay periodos creados aún.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/5">
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#050F1F]/50 uppercase tracking-wider">Nombre</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#050F1F]/50 uppercase tracking-wider">Inicio</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#050F1F]/50 uppercase tracking-wider">Fin</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[#050F1F]/50 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {periods.map((p) => (
                <tr key={p.id} className="hover:bg-black/[0.02] transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-[#050F1F]">{p.name}</td>
                  <td className="px-6 py-4 text-sm text-[#050F1F]/60">{formatDate(p.start_date)}</td>
                  <td className="px-6 py-4 text-sm text-[#050F1F]/60">{formatDate(p.end_date)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      p.is_active ? 'bg-green-50 text-green-700' : 'bg-black/5 text-[#050F1F]/50'
                    }`}>
                      {p.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggle(p.id, p.is_active)}
                        className="text-xs text-[#1A56DB] hover:underline"
                      >
                        {p.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
