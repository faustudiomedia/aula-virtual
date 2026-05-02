import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ courseId: string }>
}

const STATUS_LABELS: Record<string, string> = {
  present: 'Presente',
  absent: 'Ausente',
  late: 'Tarde',
  justified: 'Justificado',
}

const STATUS_COLORS: Record<string, string> = {
  present: 'bg-green-100/60 text-green-700',
  absent: 'bg-red-100/60 text-red-700',
  late: 'bg-yellow-100/60 text-yellow-700',
  justified: 'bg-blue-100/60 text-blue-700',
}

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  })
}

export default async function StudentAttendancePage({ params }: Props) {
  const { courseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: course } = await supabase
    .from('courses').select('title').eq('id', courseId).single()
  if (!course) redirect('/dashboard/student/courses')

  // Get all sessions for this course
  const { data: sessions } = await supabase
    .from('attendance_sessions')
    .select('id, session_date, topic')
    .eq('course_id', courseId)
    .order('session_date')

  // Get student's records
  const { data: myRecords } = await supabase
    .from('attendance_records')
    .select('session_id, status, notes')
    .eq('student_id', user.id)
    .in('session_id', (sessions ?? []).map(s => s.id))

  const recordMap = new Map(
    (myRecords ?? []).map(r => [r.session_id, r])
  )

  const sessionList = sessions ?? []
  const total = sessionList.length
  const present = sessionList.filter(s => recordMap.get(s.id)?.status === 'present').length
  const late = sessionList.filter(s => recordMap.get(s.id)?.status === 'late').length
  const absent = sessionList.filter(s => {
    const st = recordMap.get(s.id)?.status
    return st === 'absent' || !st
  }).length
  const justified = sessionList.filter(s => recordMap.get(s.id)?.status === 'justified').length
  const attendancePct = total > 0 ? Math.round(((present + late) / total) * 100) : null

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-4">
        <Link href={`/dashboard/student/courses/${courseId}`} className="text-sm text-[var(--ag-text-muted)] hover:text-[var(--ag-text)] transition-colors">
          ← {course.title}
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[var(--ag-text)] mb-6">Mi asistencia</h1>

      {/* Summary cards */}
      {total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Asistencia', value: attendancePct !== null ? `${attendancePct}%` : '—', color: 'text-[var(--ag-navy)]' },
            { label: 'Presentes', value: present, color: 'text-green-700' },
            { label: 'Ausentes', value: absent, color: 'text-red-700' },
            { label: 'Justificados', value: justified, color: 'text-blue-700' },
          ].map(card => (
            <div key={card.label} className="bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] shadow-sm p-4 text-center">
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-xs text-[var(--ag-text-muted)] mt-1">{card.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sessions table */}
      <div className="bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] shadow-sm overflow-hidden">
        {sessionList.length === 0 ? (
          <p className="p-6 text-sm text-[var(--ag-text-muted)] text-center">El docente aún no registró clases.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--ag-border-light)]">
                <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--ag-text-muted)] uppercase tracking-wider">Fecha</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--ag-text-muted)] uppercase tracking-wider">Tema</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-[var(--ag-text-muted)] uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ag-border-light)]">
              {sessionList.map(s => {
                const record = recordMap.get(s.id)
                const status = record?.status ?? 'absent'
                return (
                  <tr key={s.id} className="hover:bg-black/[0.015]">
                    <td className="px-6 py-3 text-sm text-[var(--ag-text)] capitalize">{formatDate(s.session_date)}</td>
                    <td className="px-6 py-3 text-sm text-[var(--ag-text-muted)]">{s.topic ?? '—'}</td>
                    <td className="px-6 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] ?? ''}`}>
                        {STATUS_LABELS[status] ?? status}
                      </span>
                    </td>
                  </tr>
                )
         
