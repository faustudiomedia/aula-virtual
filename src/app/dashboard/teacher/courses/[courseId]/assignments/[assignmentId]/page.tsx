import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CourseNavTabs } from '@/components/ui/CourseNavTabs'
import { gradeSubmission } from '@/app/actions/assignments'
import Link from 'next/link'
import type { Assignment, Submission } from '@/lib/types'

interface Props {
  params: Promise<{ courseId: string; assignmentId: string }>
  searchParams: Promise<{ success?: string; error?: string }>
}

interface StudentRow {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  submission: Submission | null
}

export default async function AssignmentSubmissionsPage({ params, searchParams }: Props) {
  const { courseId, assignmentId } = await params
  const { success, error } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'profesor' && profile?.role !== 'super_admin') redirect('/dashboard')

  const { data: course } = await supabase
    .from('courses').select('title').eq('id', courseId).single()
  if (!course) redirect('/dashboard/teacher')

  const { data: assignment } = await supabase
    .from('assignments').select('*').eq('id', assignmentId).single()
  if (!assignment) redirect(`/dashboard/teacher/courses/${courseId}/assignments`)

  // Fetch enrolled students
  const { data: enrollments } = await supabase
    .from('enrollments').select('student_id').eq('course_id', courseId)

  const studentIds = (enrollments ?? []).map((e: { student_id: string }) => e.student_id)

  const { data: studentProfiles } = studentIds.length
    ? await supabase.from('profiles').select('id, full_name, email, avatar_url').in('id', studentIds).order('full_name')
    : { data: [] }

  const { data: submissions } = await supabase
    .from('submissions').select('*').eq('assignment_id', assignmentId)

  const a = assignment as Assignment
  const studentList: StudentRow[] = (studentProfiles ?? []).map((p: { id: string; full_name: string | null; email: string; avatar_url: string | null }) => ({
    ...p,
    submission: (submissions as Submission[] ?? []).find((s) => s.student_id === p.id) ?? null,
  }))

  const submitted = studentList.filter((s) => s.submission).length
  const graded = studentList.filter((s) => s.submission?.graded_at).length

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-2 text-sm text-[#050F1F]/50">
        <Link href="/dashboard/teacher" className="hover:text-[#050F1F] transition-colors">← Mis cursos</Link>
        <span>/</span>
        <Link href={`/dashboard/teacher/courses/${courseId}/assignments`} className="hover:text-[#050F1F] transition-colors">Tareas</Link>
      </div>
      <h1 className="text-2xl font-bold text-[#050F1F] mb-6">{course.title}</h1>

      <CourseNavTabs courseId={courseId} />

      {/* Assignment header */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#050F1F] mb-1">{a.title}</h2>
            {a.description && (
              <p className="text-sm text-[#050F1F]/60 whitespace-pre-wrap mb-2">{a.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-[#050F1F]/40">
              <span>Puntaje máx: {a.max_score} pts</span>
              {a.due_date && (
                <span>Vence: {new Date(a.due_date).toLocaleDateString('es-AR', { dateStyle: 'short' })}</span>
              )}
            </div>
          </div>
          <div className="flex gap-4 text-center flex-shrink-0">
            <div>
              <p className="text-2xl font-bold text-[#1A56DB]">{submitted}</p>
              <p className="text-xs text-[#050F1F]/40">Entregaron</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{graded}</p>
              <p className="text-xs text-[#050F1F]/40">Calificados</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#050F1F]/30">{studentList.length - submitted}</p>
              <p className="text-xs text-[#050F1F]/40">Sin entrega</p>
            </div>
          </div>
        </div>
      </div>

      {success && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          ✓ Calificación guardada correctamente.
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* Student list */}
      <div className="space-y-4">
        {studentList.map((student) => (
          <div key={student.id} className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1A56DB] to-[#38BDF8] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {(student.full_name || student.email || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[#050F1F]">{student.full_name || 'Sin nombre'}</p>
                <p className="text-xs text-[#050F1F]/40">{student.email}</p>
              </div>
              {student.submission ? (
                <span className="text-xs px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 font-medium flex-shrink-0">
                  Entregado
                </span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 font-medium flex-shrink-0">
                  Sin entrega
                </span>
              )}
            </div>

            {student.submission && (
              <div className="border-t border-black/5 pt-4">
                {/* Submission content */}
                {student.submission.content && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-[#050F1F]/40 uppercase tracking-wide mb-1">Respuesta</p>
                    <div
                      className="text-sm text-[#050F1F]/80 bg-[#F8FAFC] rounded-xl p-4 prose prose-sm max-w-none [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-black/20 [&_blockquote]:pl-3 [&_blockquote]:text-[#050F1F]/60 [&_code]:bg-black/5 [&_code]:rounded [&_code]:px-1 [&_pre]:bg-black/5 [&_pre]:rounded-lg [&_pre]:p-3 [&_mark]:bg-yellow-200"
                      dangerouslySetInnerHTML={{ __html: student.submission.content }}
                    />
                  </div>
                )}
                {student.submission.file_url && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-[#050F1F]/40 uppercase tracking-wide mb-1">Archivo</p>
                    <a
                      href={student.submission.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#1A56DB] hover:underline"
                    >
                      📎 Ver archivo adjunto
                    </a>
                  </div>
                )}
                <p className="text-xs text-[#050F1F]/30 mb-4">
                  Entregado: {new Date(student.submission.submitted_at).toLocaleString('es-AR')}
                </p>

                {/* Grade form */}
                <form action={gradeSubmission} className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="submission_id" value={student.submission.id} />
                  <input type="hidden" name="assignment_id" value={assignmentId} />
                  <input type="hidden" name="course_id" value={courseId} />
                  <div>
                    <label className="block text-xs font-medium text-[#050F1F]/60 mb-1">
                      Puntaje (máx {a.max_score})
                    </label>
                    <input
                      name="score"
                      type="number"
                      min={0}
                      max={a.max_score}
                      defaultValue={student.submission.score ?? ''}
                      placeholder="—"
                      className="w-24 px-3 py-2 rounded-lg border border-black/10 text-sm text-[#050F1F] focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition-all"
                    />
                  </div>
                  <div className="flex-1 min-w-[160px]">
                    <label className="block text-xs font-medium text-[#050F1F]/60 mb-1">Devolución</label>
                    <input
                      name="feedback"
                      type="text"
                      defaultValue={student.submission.feedback ?? ''}
                      placeholder="Comentario al alumno..."
                      className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm text-[#050F1F] focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#1A56DB] text-white text-sm font-semibold hover:bg-[#1A56DB]/90 transition-all"
                  >
                    {student.submission.graded_at ? 'Re-calificar' : 'Calificar'}
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}

        {studentList.length === 0 && (
          <div className="text-center py-12 text-[#050F1F]/40 text-sm">
            No hay alumnos inscriptos en este curso.
          </div>
        )}
      </div>
    </div>
  )
}
