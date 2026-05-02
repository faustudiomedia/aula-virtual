import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StudentCourseNavTabs } from '@/components/ui/StudentCourseNavTabs'
import { SubmitAssignmentForm } from './SubmitAssignmentForm'
import Link from 'next/link'
import type { Assignment, Submission } from '@/lib/types'

interface Props {
  params: Promise<{ courseId: string; assignmentId: string }>
}

export default async function StudentAssignmentDetailPage({ params }: Props) {
  const { courseId, assignmentId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'alumno' && profile?.role !== 'super_admin') redirect('/dashboard')

  const { data: course } = await supabase
    .from('courses').select('title, published').eq('id', courseId).single()
  if (!course?.published) redirect('/dashboard/student')

  const { data: enrollment } = await supabase
    .from('enrollments').select('id').eq('course_id', courseId).eq('student_id', user.id).single()
  if (!enrollment) redirect('/dashboard/student')

  const { data: assignment } = await supabase
    .from('assignments').select('*').eq('id', assignmentId).single()
  if (!assignment) redirect(`/dashboard/student/courses/${courseId}/assignments`)

  const { data: submission } = await supabase
    .from('submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('student_id', user.id)
    .maybeSingle()

  const a = assignment as Assignment
  const s = submission as Submission | null
  const overdue = a.due_date && new Date(a.due_date) < new Date()

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-2 text-sm text-[var(--ag-text-muted)]">
        <Link href="/dashboard/student" className="hover:text-[var(--ag-text)] transition-colors">← Mis cursos</Link>
        <span>/</span>
        <Link href={`/dashboard/student/courses/${courseId}/assignments`} className="hover:text-[var(--ag-text)] transition-colors">Tareas</Link>
      </div>
      <h1 className="text-2xl font-bold text-[var(--ag-text)] mb-6">{course.title}</h1>

      <StudentCourseNavTabs courseId={courseId} />

      {/* Assignment details */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h2 className="text-lg font-semibold text-[var(--ag-text)]">{a.title}</h2>
          {a.due_date && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${overdue ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
              Vence: {new Date(a.due_date).toLocaleDateString('es-AR', { dateStyle: 'short' })}
            </span>
          )}
        </div>
        {a.description && (
          <p className="text-sm text-[var(--ag-text)]/70 whitespace-pre-wrap mb-4">{a.description}</p>
        )}
        <p className="text-xs text-[var(--ag-text-muted)]">Puntaje máximo: {a.max_score} pts</p>
      </div>

      {/* Grade & feedback (if graded) */}
      {s?.graded_at && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-bold text-green-700">{s.score ?? '—'}</span>
            <span className="text-green-600 font-medium">/ {a.max_score} pts</span>
          </div>
          {s.feedback && (
            <div>
              <p className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">Devolución del profesor</p>
              <p className="text-sm text-green-800">{s.feedback}</p>
            </div>
          )}
        </div>
      )}

      {/* Existing submission */}
      {s && (
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[var(--ag-text)]">Tu entrega</p>
            <span className="text-xs text-[var(--ag-text-muted)]">
              {new Date(s.submitted_at).toLocaleString('es-AR')}
            </span>
          </div>
          {s.content && (
            <div
              className="text-sm text-[var(--ag-text)]/80 bg-white rounded-xl p-4 mb-3 prose prose-sm max-w-none [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-black/20 [&_blockquote]:pl-3 [&_code]:bg-black/5 [&_code]:rounded [&_code]:px-1 [&_mark]:bg-yellow-200"
              dangerouslySetInnerHTML={{ __html: s.content }}
            />
          )}
          {s.file_url && (
            <a
              href={s.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--ag-navy)] hover:underline"
            >
              📎 Ver archivo adjunto
            </a>
          )}
        </div>
      )}

      {/* Submit / re-submit form */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
        <h3 className="text-base font-semibold text-[var(--ag-text)] mb-4">
          {s ? 'Re-entregar tarea' : 'Entregar tarea'}
        </h3>
        <SubmitAssignmentForm
          assignmentId={assignmentId}
          defaultContent={s?.content ?? ''}
          isResubmit={!!s}
        />
      </div>
    </div>
  )
}
