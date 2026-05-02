'use client'

import { useState } from 'react'
import Link from 'next/link'

export interface CalendarAssignment {
  id: string
  title: string
  courseId: string
  courseTitle: string
  dueDate: string
  submitted?: boolean
  graded?: boolean
  score?: number | null
  maxScore?: number
}

export interface CalendarMeeting {
  id: string
  displayName: string
  scheduledAt: string
}

export interface CalendarEvent {
  id: string
  title: string
  description: string | null
  eventDate: string
  eventTime: string | null
  color: string
}

interface Props {
  assignments: CalendarAssignment[]
  role: 'student' | 'teacher'
  meetings?: CalendarMeeting[]
  events?: CalendarEvent[]
  onDeleteEvent?: (id: string) => void
}

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAY_NAMES = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']

function getFirstWeekdayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return (day + 6) % 7
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

export function CalendarView({ assignments, role, meetings = [], events = [], onDeleteEvent }: Props) {
  const today = new Date()
  const [year, setYear]         = useState(today.getFullYear())
  const [month, setMonth]       = useState(today.getMonth())
  const [selected, setSelected] = useState<number | null>(null)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1)
    setSelected(null)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1)
    setSelected(null)
  }

  // Group assignments by day
  const byDay = new Map<number, CalendarAssignment[]>()
  for (const a of assignments) {
    if (!a.dueDate) continue
    const d = new Date(a.dueDate)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!byDay.has(day)) byDay.set(day, [])
      byDay.get(day)!.push(a)
    }
  }

  // Group meetings by day
  const meetingsByDay = new Map<number, CalendarMeeting[]>()
  for (const m of meetings) {
    const d = new Date(m.scheduledAt)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!meetingsByDay.has(day)) meetingsByDay.set(day, [])
      meetingsByDay.get(day)!.push(m)
    }
  }

  // Group custom events by day
  const eventsByDay = new Map<number, CalendarEvent[]>()
  for (const e of events) {
    const d = new Date(e.eventDate + 'T12:00:00')
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!eventsByDay.has(day)) eventsByDay.set(day, [])
      eventsByDay.get(day)!.push(e)
    }
  }

  // Build grid
  const cells: (number | null)[] = []
  const lead = getFirstWeekdayOfMonth(year, month)
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let d = 1; d <= getDaysInMonth(year, month); d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  // Upcoming assignments
  const upcomingAssignments = [...assignments]
    .filter(a => a.dueDate && new Date(a.dueDate) >= startOfToday)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 8)

  // Upcoming meetings
  const upcomingMeetings = [...meetings]
    .filter(m => new Date(m.scheduledAt) >= startOfToday)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5)

  function assignmentHref(a: CalendarAssignment) {
    return role === 'student'
      ? `/dashboard/student/courses/${a.courseId}/assignments/${a.id}`
      : `/dashboard/teacher/courses/${a.courseId}/assignments/${a.id}`
  }

  function StatusBadge({ a }: { a: CalendarAssignment }) {
    if (role !== 'student') return null
    const overdue = new Date(a.dueDate) < startOfToday
    if (a.graded)    return <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100/60 text-green-700">{a.score}/{a.maxScore}</span>
    if (a.submitted) return <span className="text-xs px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700">Entregado</span>
    if (overdue)     return <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100/60 text-red-600">Vencida</span>
    return <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100/60 text-amber-600">Pendiente</span>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

      {/* ── Calendar grid ─────────────────────────────── */}
      <div className="lg:col-span-2 bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-[var(--ag-text)]">{MONTH_NAMES[month]} {year}</h2>
          <div className="flex gap-1">
            <button onClick={prevMonth} className="w-8 h-8 rounded-lg border border-[var(--ag-border)] flex items-center justify-center text-[var(--ag-text-muted)] hover:bg-[rgba(30,58,95,0.06)] transition-all">‹</button>
            <button onClick={nextMonth} className="w-8 h-8 rounded-lg border border-[var(--ag-border)] flex items-center justify-center text-[var(--ag-text-muted)] hover:bg-[rgba(30,58,95,0.06)] transition-all">›</button>
          </div>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES.map(d => (
            <div key={d} className="text-center text-xs font-medium text-[var(--ag-text)]/30 py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />
            const dayAssignments = byDay.get(day) ?? []
            const dayMeetings    = meetingsByDay.get(day) ?? []
            const dayEvents      = eventsByDay.get(day) ?? []
            const hasItems = dayAssignments.length > 0 || dayMeetings.length > 0 || dayEvents.length > 0
            const isToday    = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
            const isSelected = day === selected

            return (
              <button
                key={`d-${day}`}
                onClick={() => setSelected(isSelected ? null : day)}
                className={`relative flex flex-col items-center justify-start pt-1.5 pb-1 min-h-[52px] rounded-xl text-sm transition-all ${
                  isSelected ? 'bg-[var(--ag-navy)] text-white shadow-md '
                  : isToday   ? 'bg-[rgba(30,58,95,0.08)] text-[var(--ag-navy)] font-bold ring-1 ring-[var(--ag-border-light)]'
                  : 'hover:bg-[var(--ag-surface)] text-[var(--ag-text)]'
                }`}
              >
                <span className="text-xs font-semibold leading-none">{day}</span>
                {hasItems && (
                  <div className="flex gap-0.5 mt-1.5 flex-wrap justify-center px-1">
                    {dayAssignments.slice(0, 2).map((_, j) => (
                      <span key={`a-${j}`} className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSelected ? 'bg-[var(--ag-surface)]/70' : 'bg-[var(--ag-navy)]'}`} />
                    ))}
                    {dayMeetings.slice(0, 2).map((_, j) => (
                      <span key={`m-${j}`} className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSelected ? 'bg-[var(--ag-surface)]/70' : 'bg-green-500'}`} />
                    ))}
                    {dayEvents.slice(0, 2).map((e, j) => (
                      <span key={`ev-${j}`} className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: isSelected ? 'rgba(255,255,255,0.7)' : e.color }} />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 pt-4 border-t border-[var(--ag-border-light)]">
          <div className="flex items-center gap-1.5 text-xs text-[var(--ag-text-muted)]">
            <span className="w-2 h-2 rounded-full bg-[var(--ag-navy)] inline-block" /> Tareas
          </div>
          {meetings.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--ag-text-muted)]">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Reuniones
            </div>
          )}
          {events.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--ag-text-muted)]">
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Eventos
            </div>
          )}
        </div>

        {/* Selected day detail */}
        {selected !== null && (
          <div className="mt-5 pt-5 border-t border-[var(--ag-border-light)]">
            <p className="text-sm font-semibold text-[var(--ag-text)] mb-3">{selected} de {MONTH_NAMES[month]}</p>
            {(byDay.get(selected) ?? []).length === 0 && (meetingsByDay.get(selected) ?? []).length === 0 && (eventsByDay.get(selected) ?? []).length === 0 ? (
              <p className="text-sm text-[var(--ag-text-muted)]">No hay eventos para este día.</p>
            ) : (
              <div className="space-y-2">
                {(eventsByDay.get(selected) ?? []).map(e => (
                  <div
                    key={e.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: e.color + '18' }}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--ag-text)] truncate">📅 {e.title}</p>
                      {e.description && <p className="text-xs text-[var(--ag-text-muted)] truncate">{e.description}</p>}
                      {e.eventTime && <p className="text-xs text-[var(--ag-text-muted)]">{e.eventTime.slice(0, 5)}</p>}
                    </div>
                    {onDeleteEvent && role === 'teacher' && (
                      <button
                        onClick={() => onDeleteEvent(e.id)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors px-1"
                      >✕</button>
                    )}
                  </div>
                ))}
                {(meetingsByDay.get(selected) ?? []).map(m => (
                  <Link
                    key={m.id}
                    href={`/dashboard/meetings/${m.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 hover:border-green-300 hover:shadow-sm transition-all group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-green-100 group-hover:bg-green-200 flex items-center justify-center text-base flex-shrink-0 transition-colors">🎥</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--ag-text)] truncate group-hover:text-green-700 transition-colors">{m.displayName}</p>
                      <p className="text-xs text-green-600">{new Date(m.scheduledAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs</p>
                    </div>
                    <span className="text-green-400 group-hover:text-green-600 text-sm transition-colors">→</span>
                  </Link>
                ))}
                {(byDay.get(selected) ?? []).map(a => (
                  <Link
                    key={a.id}
                    href={assignmentHref(a)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(30,58,95,0.06)] hover:bg-[#E0F2FE] transition-all group"
                  >
                    <div className="w-2 h-2 rounded-full bg-[var(--ag-navy)] flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--ag-text)] truncate group-hover:text-[var(--ag-navy)]">{a.title}</p>
                      <p className="text-xs text-[var(--ag-text-muted)] truncate">{a.courseTitle}</p>
                    </div>
                    <StatusBadge a={a} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Sidebar ──────────────────────�
