'use client'

import { useActionState, useState } from 'react'
import { createCalendarEvent } from '@/app/actions/calendar'

const COLORS = ['var(--ag-navy)','#059669','#7C3AED','#D97706','#DC2626','#0891B2','#BE185D']

export function CreateEventForm() {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(
    async (prev: unknown, fd: FormData) => {
      const res = await createCalendarEvent(prev, fd)
      if (!res?.error) setOpen(false)
      return res
    },
    null
  )

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="px-4 py-2 rounded-xl bg-[var(--ag-navy)] text-white text-sm font-medium hover:bg-[#1648c4] transition-colors"
    >
      + Nuevo evento
    </button>
  )

  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--ag-text)]">Crear evento</h3>
        <button onClick={() => setOpen(false)} className="text-[var(--ag-text-muted)] hover:text-[var(--ag-text)] text-lg leading-none">✕</button>
      </div>
      <form action={action} className="space-y-3">
        <input
          name="title"
          placeholder="Título del evento *"
          required
          className="w-full text-sm border border-black/10 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30"
        />
        <input
          name="description"
          placeholder="Descripción (opcional)"
          className="w-full text-sm border border-black/10 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            name="event_date"
            required
            className="w-full text-sm border border-black/10 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30"
          />
          <input
            type="time"
            name="event_time"
            className="w-full text-sm border border-black/10 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30"
          />
        </div>
        <div>
          <p className="text-xs text-[var(--ag-text-muted)] mb-2">Color</p>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map(c => (
              <label key={c} className="cursor-pointer">
                <input type="radio" name="color" value={c} className="sr-only" defaultChecked={c === var(--ag-navy)} />
                <span className="w-6 h-6 rounded-full inline-block ring-2 ring-offset-1 ring-transparent has-[:checked]:ring-current" style={{ background: c }} />
              </label>
            ))}
          </div>
        </div>
        {state?.error && <p className="text-xs text-red-500">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full py-2 rounded-xl bg-[var(--ag-navy)] text-white text-sm font-medium hover:bg-[#1648c4] disabled:opacity-50 transition-colors"
        >
          {pending ? 'Guardando…' : 'Guardar evento'}
        </button>
      </form>
    </div>
  )
}
