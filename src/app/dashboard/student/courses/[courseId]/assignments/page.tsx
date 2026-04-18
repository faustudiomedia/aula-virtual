import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StudentCourseNavTabs } from '@/components/ui/StudentCourseNavTabs'
import Link from 'next/link'
import type { Assignment, Submission } from '@/lib/types'

interface Props {
  params: Promise<{ courseId: string }>
}

export default async function StudentAssignmentsPage({ params }: Props) {
  const { courseId } = await params

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

  const { data: assignments } = await supabase
    .from('assignments')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })

  const assignmentIds = (assignments ?? []).map((a: Assignment) => a.id)
  const { data: mySubmissions } = assignmentIds.length
    ? await supabase.from('submissions').select('*').in('assignment_id', assignmentIds).eq('student_id', user.id)
    : { data: [] }

  const submissionMap = new Map((mySubmissions as Submission[] ?? []).map((s) => [s.assignment_id, s]))

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-2">
        <Link href="/dashboard/student" className="text-sm text-[#050F1F]/50 hover:text-[#050F1F] transition-colors">
          ← Mis cursos
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[#050F1F] mb-6">{course.title}</h1>

      <StudentCourseNavTabs courseId={courseId} />

      <div className="space-y-4">
        {(assignments as Assignment[] ?? []).map((a) => {
          const submission = submissionMap.get(a.id)
          const overdue = a.due_date && new Date(a.due_date) < new Date()

          let statusLabel = 'Pendiente'
          let statusColor = 'bg-amber-50 text-amber-600'
          if (submission?.graded_at) {
            statusLabel = `${submission.score ?? 0}/${a.max_score} pts`
            statusColor = 'bg-green-50 text-green-700'
          } else if (submission) {
            statusLabel = 'Entregado'
            statusColor = 'bg-sky-50 text-sky-700'
          } else if (overdue) {
            statusLabel = 'Vencida'
            statusColor = 'bg-red-50 text-red-600'
          }

          return (
            <Link
              key={a.id}
              href={`/dashboard/student/courses/${courseId}/assignments/${a.id}`}
              className="block bg-white rounded-2xl border border-black/5 shadow-sm p-5 hover:shadow-md hover:border-[#38BDF8]/30 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold text-[#050F1F] mb-1">{a.title}</h3>
                  {a.description && (
                    <p className="text-sm text-[#050F1F]/50 line-clamp-2 mb-2">{a.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-[#050F1F]/40">
                    <span>Puntaje: {a.max_score} pts</span>
                    {a.due_date && (
                      <span>Vence: {new Date(a.due_date).toLocaleDateString('es-AR', { dateStyle: 'short' })}</span>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>
            </Link>
          )
        })}
        {(assignments ?? []).length === 0 && (
          <div className="text-center py-16 text-[#050F1F]/40 text-sm">
            No hay tareas asignadas todavía.
          </div>
        )}
      </div>
    </div>
  )
}
