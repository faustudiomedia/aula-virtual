import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CourseNavTabs } from '@/components/ui/CourseNavTabs'
import { deleteAssignment } from '@/app/actions/assignments'
import Link from 'next/link'
import type { Assignment } from '@/lib/types'

interface Props {
  params: Promise<{ courseId: string }>
  searchParams: Promise<{ error?: string }>
}

export default async function TeacherAssignmentsPage({ params, searchParams }: Props) {
  const { courseId } = await params
  const { error } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'profesor' && profile?.role !== 'super_admin') redirect('/dashboard')

  const { data: course } = await supabase
    .from('courses').select('title').eq('id', courseId).single()
  if (!course) redirect('/dashboard/teacher')

  const { data: assignments } = await supabase
    .from('assignments')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })

  async function handleDelete(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    await deleteAssignment(id)
    redirect(`/dashboard/teacher/courses/${courseId}/assignments`)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-2">
        <Link href="/dashboard/teacher" className="text-sm text-[var(--ag-text-muted)] hover:text-[var(--ag-text)] transition-colors">
          ← Mis cursos
        </Link>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--ag-text)]">{course.title}</h1>
        <Link
          href={`/dashboard/teacher/courses/${courseId}/assignments/new`}
          className="px-4 py-2 rounded-xl bg-[var(--ag-navy)] text-white text-sm font-semibold hover:bg-[var(--ag-navy)]/90 transition-all shadow-lg "
        >
          + Nueva tarea
        </Link>
      </div>

      <CourseNavTabs courseId={courseId} />

      {error && (
        <div className="mb-4 rounded-lg bg-red-100/50 border border-red-300/50/70 px-4 py-3 text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      <div className="space-y-4">
        {(assignments as Assignment[] ?? []).map((a) => {
          const overdue = a.due_date && new Date(a.due_date) < new Date()
          return (
            <div key={a.id} className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[var(--ag-text)]">{a.title}</h3>
                    {a.due_date && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${overdue ? 'bg-red-100/60 text-red-600' : 'bg-amber-100/60 text-amber-600'}`}>
                        {overdue ? 'Vencida' : 'Activa'}
                      </span>
                    )}
                  </div>
                  {a.description && (
                    <p className="text-sm text-[var(--ag-text-muted)] line-clamp-2 mb-2">{a.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-[var(--ag-text-muted)]">
                    <span>Puntaje máx: {a.max_score} pts</span>
                    {a.due_date && (
                      <span>
                        Vence: {new Date(a.due_date).toLocaleDateString('es-AR', { dateStyle: 'short' })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Link
                    href={`/dashboard/teacher/courses/${courseId}/assignments/${a.id}`}
                    className="px-3 py-1.5 rounded-lg border border-black/10 text-xs font-medium text-[var(--ag-text)]/70 hover:bg-[rgba(30,58,95,0.06)] transition-all"
                  >
                    Ver entregas
                  </Link>
                  <form action={handleDelete}>
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className="text-xs text-red-400 hover:text-red-600 transition-colors">
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )
        })}
        {(assignments ?? []).length === 0 && (
          <div className="text-center py-16 text-[var(--ag-text-muted)] text-sm">
            No hay tareas creadas. Creá la primera con el botón d