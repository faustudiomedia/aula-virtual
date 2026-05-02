'use client'

import { useState, useTransition, useActionState } from 'react'
import { createAttendanceSession, saveAttendanceRecords } from '@/app/actions/attendance'
import { createClient } from '@/lib/supabase/client'

interface Student {
  id: string
  fullName: string
  email: string
  legajo: string | null
}

interface Session {
  id: string
  session_date: string
  topic: string | null
  created_at: string
}

interface Props {
  courseId: string
  students: Student[]
  sessions: Session[]
}

type AttendanceStatus = 'present' | 'absent' | 'late' | 'justified'

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Presente',
  absent: 'Ausente',
  late: 'Tarde',
  justified: 'Justificado',
}

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: 'bg-green-100 text-green-700 border-green-300/50',
  absent: 'bg-red-100 text-red-700 border-red-300/50',
  late: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  justified: 'bg-blue-100 text-blue-700 border-blue-300/50',
}

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  })
}

export default function AttendanceView({ courseId, students, sessions: initialSessions }: Props) {
  const [sessions, setSessions] = useState(initialSessions)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [records, setRecords] = useState<Record<string, AttendanceStatus>>({})
  const [loadingSession, setLoadingSession] = useState(false)
  const [saving, startSave] = useTransition()
  const [showNew, setShowNew] = useState(false)
  const [createState, createAction, creating] = useActionState(createAttendanceSession, {})

  async function loadSession(sessionId: string) {
    setLoadingSession(true)
    setActiveSessionId(sessionId)
    const supabase = createClient()
    const { data } = await supabase
      .from('attendance_records')
      .select('student_id, status')
      .eq('session_id', sessionId)

    const map: Record<string, AttendanceStatus> = {}
    // Default all to absent
    students.forEach(s => { map[s.id] = 'absent' })
    ;(data ?? []).forEach((r: { student_id: string; status: string }) => {
      map[r.student_id] = r.status as AttendanceStatus
    })
    setRecords(map)
    setLoadingSession(false)
  }

  function handleSave() {
    if (!activeSessionId) return
    startSave(async () => {
      const entries = Object.entries(records).map(([studentId, status]) => ({ studentId, status }))
      await saveAttendanceRecords(activeSessionId, courseId, entries)
    })
  }

  // When a new session is created, reload
  if (createState.success && createState.sessionId && !sessions.find(s => s.id === createState.sessionId)) {
    // Will be refreshed on next navigation; for now show success
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--ag-text-muted)]">{sessions.length} {sessions.length === 1 ? 'sesión registrada' : 'sesiones registradas'}</p>
        <button
          onClick={() => setShowNew(v => !v)}
          className="px-4 py-2 rounded-lg bg-[var(--ag-navy)] text-white text-sm font-medium hover:bg-[var(--ag-navy)]/90 transition-colors"
        >
          + Nueva clase
        </button>
      </div>

      {/* New session form */}
      {showNew && (
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-[var(--ag-text)] mb-4">Registrar nueva clase</h3>
          <form action={async (fd) => {
            fd.set('course_id', courseId)
            await createAction(fd)
            setShowNew(false)
            // Reload page to get new session
            window.location.reload()
          }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ag-text-muted)] mb-1">Fecha</label>
              <input
                name="session_date"
                type="date"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ag-text-muted)] mb-1">Tema (opcional)</label>
              <input
                name="topic"
                placeholder="Ej: Introducción al álgebra"
                className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30"
              />
            </div>
            {createState.error && (
              <p className="md:col-span-2 text-xs text-red-600">{createState.error}</p>
            )}
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 rounded-lg bg-[var(--ag-navy)] text-white text-sm font-medium hover:bg-[var(--ag-navy)]/90 disabled:opacity-50 transition-colors"
              >
                {creating ? 'Creando...' : 'Crear clase'}
              </button>
              <button
                type="button"
                onClick={() => setShowNew(false)}
                className="px-4 py-2 rounded-lg border border-black/10 text-sm font-medium hover:bg-black/5 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Session list */}
        <div className="md:col-span-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ag-text-muted)] mb-3">Clases</h3>
          <div className="space-y-2">
            {sessions.length === 0 && (
              <p className="text-sm text-[var(--ag-text-muted)]">No hay clases registradas.</p>
            )}
            {sessions.map(s => (
              <button
                key={s.id}
                onClick={() => loadSession(s.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                  activeSessionId === s.id
                    ? 'bg-[var(--ag-navy)]/5 border-[var(--ag-navy)]/20 text-[var(--ag-navy)]'
                    : 'bg-white border-black/5 hover:bg-black/[0.02] text-[var(--ag-text)]'
                }`}
              >
                <p className="text-sm font-medium capitalize">{formatDate(s.session_date)}</p>
                {s.topic && <p className="text-xs text-[var(--ag-text-muted)] mt-0.5 truncate">{s.topic}</p>}
              </button>
            ))}
          </div>
        </div>

        {/* Attendance sheet */}
        <div className="md:col-span-2">
          {!activeSessionId ? (
            <div className="flex items-center justify-center h-48 bg-white rounded-2xl border border-black/5 text-sm text-[var(--ag-text-muted)]">
              Seleccioná una clase para tomar asistencia
            </div>
          ) : loadingSession ? (
            <div className="flex items-center justify-center h-48 bg-white rounded-2xl border border-black/5 text-sm text-[var(--ag-text-muted)]">
              Cargando...
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between">
                <p className="text-sm font-medium text-[var(--ag-text)]">
                  {students.length} {students.length === 1 ? 'alumno' : 'alumnos'}
                </p>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-[var(--ag-navy)] text-white text-sm font-medium hover:bg-[var(--ag-navy)]/90 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Guardando...' : 'Guardar asistencia'}
                </button>
              </div>
              {students.length === 0 ? (
                <p className="p-6 text-sm text-[var(--ag-text-muted)]">No hay alumnos inscriptos.</p>
              ) : (
                <div className="divide-y divide-black/5">
                  {students.map(s => (
                    <div key={s.id} className="px-6 py-3 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--ag-text)] truncate">{s.fullName}</p>
                        {s.legajo && <p className="text-xs text-[var(--ag-text-muted)]">Leg. {s.legajo}</p>}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {(['present', 'absent', 'late', 'justified'] as AttendanceStatus[]).map(st => (
                          <button
                            key={st}
                            onClick={() => setRecords(r => ({ ...r, [s.id]: st }))}
                            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                              records[s.id] === st
                                ? STATUS_COLORS[st]
                                : 'bg-white border-black/10 text-[var(--ag-text-muted)] hover:border-black/20'
                            }`}
                          >
                            {STATUS_LABELS[st]}
                          </button>
                     