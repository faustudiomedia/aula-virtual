'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { CalendarEvent } from '@/lib/types'
import { createEvent, deleteEvent } from '@/app/actions/campus'

const EVENT_STYLES: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  clase:   { icon: '📖', color: '#1A56DB', bg: '#EFF6FF', label: 'Clase' },
  examen:  { icon: '📝', color: '#DC2626', bg: '#FEF2F2', label: 'Examen' },
  entrega: { icon: '📦', color: '#D97706', bg: '#FFFBEB', label: 'Entrega' },
  otro:    { icon: '📌', color: '#7C3AED', bg: '#F5F3FF', label: 'Otro' },
}

interface Props {
  events: CalendarEvent[]
  isTeacher: boolean
  teacherCourses: { id: string; title: string }[]
}

export default function CalendarView({ events, isTeacher, teacherCourses }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [courseId, setCourseId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventType, setEventType] = useState('clase')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')

  function handleCreate() {
    if (!courseId || !title.trim() || !startAt) { setError('Completá curso, título y fecha'); return }
    setError(null)
    startTransition(async () => {
      const res = await createEvent(courseId, title, description, eventType, startAt, endAt || undefined)
      if (!res.success) { setError(res.error ?? 'Error'); return }
      setTitle(''); setDescription(''); setStartAt(''); setEndAt(''); setShowForm(false); router.refresh()
    })
  }

  function handleDelete(evtId: string) {
    if (!confirm('¿Eliminar este evento?')) return
    startTransition(async () => { await deleteEvent(evtId); router.refresh() })
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' })
  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

  // Group events by date
  const byDate: Record<string, CalendarEvent[]> = {}
  events.forEach((e) => {
    const day = new Date(e.start_at).toISOString().split('T')[0]
    if (!byDate[day]) byDate[day] = []
    byDate[day].push(e)
  })

  const sortedDates = Object.keys(byDate).sort()
  const today = new Date().toISOString().split('T')[0]

  return (
    <div>
      {/* Create button for teachers */}
      {isTeacher && (
        <div className="mb-6">
          <button
            onClick={() => { setShowForm(!showForm); setError(null) }}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#1A56DB] text-white hover:opacity-90 transition shadow-lg shadow-[#1A56DB]/20"
          >
            {showForm ? 'Cancelar' : '+ Nuevo evento'}
          </button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-5 mb-6 space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#050F1F] mb-1">Curso *</label>
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                <option value="">Seleccionar...</option>
                {teacherCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#050F1F] mb-1">Tipo</label>
              <select value={eventType} onChange={(e) => setEventType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                {Object.entries(EVENT_STYLES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </div>
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título del evento *"
            className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción (opcional)"
            rows={2} className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#050F1F] mb-1">Inicio *</label>
              <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#050F1F] mb-1">Fin (opcional)</label>
              <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
          </div>
          <button onClick={handleCreate} disabled={isPending}
            className="px-5 py-2 rounded-lg bg-[#1A56DB] text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-60">
            {isPending ? 'Creando...' : 'Crear evento'}
          </button>
        </div>
      )}

      {/* Events timeline */}
      {sortedDates.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#BAE6FD] p-10 text-center">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-[#050F1F]/50">No hay eventos programados.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => {
            const isToday = date === today
            const isPast = date < today
            return (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isToday ? 'bg-[#1A56DB] animate-pulse' : isPast ? 'bg-black/20' : 'bg-[#059669]'}`} />
                  <span className={`text-sm font-semibold ${isToday ? 'text-[#1A56DB]' : isPast ? 'text-[#050F1F]/40' : 'text-[#050F1F]'}`}>
                    {formatDate(byDate[date][0].start_at)}
                    {isToday && <span className="ml-2 px-2 py-0.5 rounded-full bg-[#1A56DB] text-white text-xs">Hoy</span>}
                  </span>
                </div>
                <div className="ml-6 space-y-2">
                  {byDate[date].map((evt) => {
                    const style = EVENT_STYLES[evt.event_type] ?? EVENT_STYLES.otro
                    return (
                      <div key={evt.id} className="rounded-xl border border-black/5 p-4 flex items-center gap-4 transition-all hover:shadow-sm" style={{ background: style.bg }}>
                        <span className="text-xl flex-shrink-0">{style.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium text-sm text-[#050F1F]">{evt.title}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ color: style.color, background: `${style.color}15` }}>{style.label}</span>
                          </div>
                          {evt.description && <p className="text-xs text-[#050F1F]/50 truncate">{evt.description}</p>}
                          <p className="text-xs text-[#050F1F]/40 mt-1">
                            {evt.courses?.title && <span className="font-medium">{evt.courses.title}</span>}
                            {' · '}{formatTime(evt.start_at)}
                            {evt.end_at && ` - ${formatTime(evt.end_at)}`}
                          </p>
                        </div>
                        {isTeacher && (
                          <button onClick={() => handleDelete(evt.id)}
                            className="text-red-400 hover:text-red-600 text-xs flex-shrink-0 transition">
                            🗑
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
