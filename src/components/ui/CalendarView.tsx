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

interface Props {
  assignments: CalendarAssignment[]
  role: 'student' | 'teacher'
  meetings?: CalendarMeeting[]
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

export function CalendarView({ assignments, role, meetings = [] }: Props) {
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
    if (a.graded)    return <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-700">{a.score}/{a.maxScore}</span>
    if (a.submitted) return <span className="text-xs px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700">Entregado</span>
    if (overdue)     return <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">Vencida</span>
    return <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600">Pendiente</span>
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

      {/* ── Calendar grid ─────────────────────────────── */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-black/5 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-[#050F1F]">{MONTH_NAMES[month]} {year}</h2>
          <div className="flex gap-1">
            <button onClick={prevMonth} className="w-8 h-8 rounded-lg border border-black/10 flex items-center justify-center text-[#050F1F]/60 hover:bg-[#F0F9FF] transition-all">‹</button>
            <button onClick={nextMonth} className="w-8 h-8 rounded-lg border border-black/10 flex items-center justify-center text-[#050F1F]/60 hover:bg-[#F0F9FF] transition-all">›</button>
          </div>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES.map(d => (
            <div key={d} className="text-center text-xs font-medium text-[#050F1F]/30 py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />
            const dayAssignments = byDay.get(day) ?? []
            const dayMeetings    = meetingsByDay.get(day) ?? []
            const hasItems = dayAssignments.length > 0 || dayMeetings.length > 0
            const isToday    = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
            const isSelected = day === selected

            return (
              <button
                key={`d-${day}`}
                onClick={() => setSelected(isSelected ? null : day)}
                className={`relative flex flex-col items-center justify-start pt-1.5 pb-1 min-h-[52px] rounded-xl text-sm transition-all ${
                  isSelected ? 'bg-[#1A56DB] text-white shadow-md shadow-[#1A56DB]/20'
                  : isToday   ? 'bg-[#EFF6FF] text-[#1A56DB] font-bold ring-1 ring-[#1A56DB]/20'
                  : 'hover:bg-[#F8FAFC] text-[#050F1F]'
                }`}
              >
                <span className="text-xs font-semibold leading-none">{day}</span>
                {hasItems && (
                  <div className="flex gap-0.5 mt-1.5 flex-wrap justify-center px-1">
                    {dayAssignments.slice(0, 2).map((_, j) => (
                      <span key={`a-${j}`} className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSelected ? 'bg-white/70' : 'bg-[#1A56DB]'}`} />
                    ))}
                    {dayMeetings.slice(0, 2).map((_, j) => (
                      <span key={`m-${j}`} className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSelected ? 'bg-white/70' : 'bg-green-500'}`} />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        {meetings.length > 0 && (
          <div className="flex gap-4 mt-4 pt-4 border-t border-black/5">
            <div className="flex items-center gap-1.5 text-xs text-[#050F1F]/40">
              <span className="w-2 h-2 rounded-full bg-[#1A56DB] inline-block" /> Tareas
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#050F1F]/40">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Reuniones
            </div>
          </div>
        )}

        {/* Selected day detail */}
        {selected !== null && (
          <div className="mt-5 pt-5 border-t border-black/5">
            <p className="text-sm font-semibold text-[#050F1F] mb-3">{selected} de {MONTH_NAMES[month]}</p>
            {(byDay.get(selected) ?? []).length === 0 && (meetingsByDay.get(selected) ?? []).length === 0 ? (
              <p className="text-sm text-[#050F1F]/40">No hay eventos para este día.</p>
            ) : (
              <div className="space-y-2">
                {(meetingsByDay.get(selected) ?? []).map(m => (
                  <Link
                    key={m.id}
                    href={`/dashboard/meetings/${m.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-green-50 hover:bg-green-100 transition-all group"
                  >
                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#050F1F] truncate group-hover:text-green-700">🎥 {m.displayName}</p>
                      <p className="text-xs text-[#050F1F]/50">{new Date(m.scheduledAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </Link>
                ))}
                {(byDay.get(selected) ?? []).map(a => (
                  <Link
                    key={a.id}
                    href={assignmentHref(a)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#F0F9FF] hover:bg-[#E0F2FE] transition-all group"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#1A56DB] flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#050F1F] truncate group-hover:text-[#1A56DB]">{a.title}</p>
                      <p className="text-xs text-[#050F1F]/50 truncate">{a.courseTitle}</p>
                    </div>
                    <StatusBadge a={a} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Sidebar ──────────────────────────── */}
      <div className="space-y-4">
        {upcomingMeetings.length > 0 && (
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-[#050F1F] mb-3">Próximas reuniones</h3>
            <div className="space-y-2">
              {upcomingMeetings.map(m => {
                const d = new Date(m.scheduledAt)
                return (
                  <Link
                    key={m.id}
                    href={`/dashboard/meetings/${m.id}`}
                    className="block p-3 rounded-xl border border-green-100 bg-green-50 hover:bg-green-100 transition-all"
                  >
                    <p className="text-sm font-medium text-[#050F1F] line-clamp-1">🎥 {m.displayName}</p>
                    <p className="text-xs text-green-700 mt-1">
                      {d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })} · {d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-[#050F1F] mb-3">Próximas entregas</h3>
          {upcomingAssignments.length === 0 ? (
            <p className="text-sm text-[#050F1F]/40">No hay entregas próximas.</p>
          ) : (
            <div className="space-y-2">
              {upcomingAssignments.map(a => {
                const d = new Date(a.dueDate)
                const overdue = d < startOfToday
                const isThisMonth = d.getMonth() === month && d.getFullYear() === year
                return (
                  <Link
                    key={a.id}
                    href={assignmentHref(a)}
                    className="block p-3 rounded-xl border border-black/5 hover:border-[#38BDF8]/40 hover:bg-[#F8FAFC] transition-all"
                  >
                    <p className="text-sm font-medium text-[#050F1F] mb-0.5 line-clamp-1">{a.title}</p>
                    <p className="text-xs text-[#050F1F]/40 truncate mb-2">{a.courseTitle}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-medium ${overdue ? 'text-red-500' : isThisMonth ? 'text-[#1A56DB]' : 'text-amber-600'}`}>
                        {d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined })}
                      </span>
                      <StatusBadge a={a} />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
