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

interface Props {
  assignments: CalendarAssignment[]
  role: 'student' | 'teacher'
}

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAY_NAMES = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']

function getFirstWeekdayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return (day + 6) % 7 // Mon = 0
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

export function CalendarView({ assignments, role }: Props) {
  const today = new Date()
  const [year, setYear]     = useState(today.getFullYear())
  const [month, setMonth]   = useState(today.getMonth())
  const [selected, setSelected] = useState<number | null>(null)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1)
    setSelected(null)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1)
    setSelected(null)
  }

  // Group by day of current month
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

  // Build grid (Mon-first)
  const cells: (number | null)[] = []
  const lead = getFirstWeekdayOfMonth(year, month)
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let d = 1; d <= getDaysInMonth(year, month); d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  // Upcoming from today onwards, sorted by date
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const upcoming = [...assignments]
    .filter(a => a.dueDate && new Date(a.dueDate) >= startOfToday)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 10)

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
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-[#050F1F]">
            {MONTH_NAMES[month]} {year}
          </h2>
          <div className="flex gap-1">
            <button
              onClick={prevMonth}
              className="w-8 h-8 rounded-lg border border-black/10 flex items-center justify-center text-[#050F1F]/60 hover:bg-[#F0F9FF] transition-all"
            >
              ‹
            </button>
            <button
              onClick={nextMonth}
              className="w-8 h-8 rounded-lg border border-black/10 flex items-center justify-center text-[#050F1F]/60 hover:bg-[#F0F9FF] transition-all"
            >
              ›
            </button>
          </div>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES.map(d => (
            <div key={d} className="text-center text-xs font-medium text-[#050F1F]/30 py-1">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />
            const dayAssignments = byDay.get(day) ?? []
            const hasItems = dayAssignments.length > 0
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
            const isSelected = day === selected

            return (
              <button
                key={`d-${day}`}
                onClick={() => setSelected(isSelected ? null : day)}
                className={`relative flex flex-col items-center justify-start pt-1.5 pb-1 min-h-[52px] rounded-xl text-sm transition-all ${
                  isSelected
                    ? 'bg-[#1A56DB] text-white shadow-md shadow-[#1A56DB]/20'
                    : isToday
                    ? 'bg-[#EFF6FF] text-[#1A56DB] font-bold ring-1 ring-[#1A56DB]/20'
                    : 'hover:bg-[#F8FAFC] text-[#050F1F]'
                }`}
              >
                <span className="text-xs font-semibold leading-none">{day}</span>
                {hasItems && (
                  <div className="flex gap-0.5 mt-1.5 flex-wrap justify-center px-1">
                    {dayAssignments.slice(0, 3).map((_, j) => (
                      <span
                        key={j}
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          isSelected ? 'bg-white/70' : 'bg-[#1A56DB]'
                        }`}
                      />
                    ))}
                    {dayAssignments.length > 3 && (
                      <span className={`text-[9px] leading-none font-bold ${isSelected ? 'text-white/70' : 'text-[#1A56DB]'}`}>
                        +{dayAssignments.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Selected day detail */}
        {selected !== null && (
          <div className="mt-5 pt-5 border-t border-black/5">
            <p className="text-sm font-semibold text-[#050F1F] mb-3">
              {selected} de {MONTH_NAMES[month]}
            </p>
            {(byDay.get(selected) ?? []).length === 0 ? (
              <p className="text-sm text-[#050F1F]/40">No hay tareas para este día.</p>
            ) : (
              <div className="space-y-2">
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

      {/* ── Upcoming sidebar ──────────────────────────── */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
        <h3 className="text-base font-semibold text-[#050F1F] mb-4">Próximas entregas</h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-[#050F1F]/40">No hay entregas próximas.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map(a => {
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
                    <span
                      className={`text-xs font-medium ${
                        overdue ? 'text-red-500' : isThisMonth ? 'text-[#1A56DB]' : 'text-amber-600'
                      }`}
                    >
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
  )
}
