import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CourseNavTabs } from '@/components/ui/CourseNavTabs'
import { createThread, deleteThread, togglePinThread } from '@/app/actions/forum'

interface Props { params: Promise<{ courseId: string }> }

export default async function TeacherForumPage({ params }: Props) {
  const { courseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: course } = await supabase
    .from('courses').select('id, title, teacher_id').eq('id', courseId).single()
  if (!course) redirect('/dashboard/teacher')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'profesor' && profile?.role !== 'super_admin') redirect('/dashboard')

  const { data: threads } = await supabase
    .from('forum_threads')
    .select('id, title, content, pinned, created_at, author_id, profiles(full_name)')
    .eq('course_id', courseId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })

  const isTeacher = course.teacher_id === user.id || profile?.role === 'super_admin'

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-[#050F1F] mb-1">{course.title}</h1>
      <CourseNavTabs courseId={courseId} />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-[#050F1F]">Foro del curso</h2>
        <Link
          href={`/dashboard/teacher/courses/${courseId}/forum/new`}
          className="px-4 py-2 rounded-xl bg-[#1A56DB] text-white text-sm font-medium hover:bg-[#1A56DB]/90 transition-all"
        >
          + Nuevo tema
        </Link>
      </div>

      {(!threads || threads.length === 0) ? (
        <div className="text-center py-16 text-[#050F1F]/40">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-sm">No hay temas en el foro todavía.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((t) => {
            const author = t.profiles as { full_name: string } | null
            return (
              <div key={t.id} className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {t.pinned && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">📌 Fijado</span>
                    )}
                    <Link
                      href={`/dashboard/teacher/courses/${courseId}/forum/${t.id}`}
                      className="text-base font-semibold text-[#050F1F] hover:text-[#1A56DB] transition-colors truncate"
                    >
                      {t.title}
                    </Link>
                  </div>
                  <p className="text-sm text-[#050F1F]/50 line-clamp-2">{t.content}</p>
                  <p className="text-xs text-[#050F1F]/30 mt-2">
                    {author?.full_name ?? 'Desconocido'} · {new Date(t.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                {isTeacher && (
                  <div className="flex gap-2 flex-shrink-0">
                    <form action={togglePinThread.bind(null, t.id, t.pinned, courseId)}>
                      <button
                        type="submit"
                        className="text-xs px-3 py-1.5 rounded-lg border border-black/10 text-[#050F1F]/50 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-all"
                      >
                        {t.pinned ? 'Desfijar' : 'Fijar'}
                      </button>
                    </form>
                    <form action={deleteThread.bind(null, t.id, courseId)}>
                      <button
                        type="submit"
                        className="text-xs px-3 py-1.5 rounded-lg border border-black/10 text-[#050F1F]/50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                        onClick={(e) => { if (!confirm('¿Eliminar este tema?')) e.preventDefault() }}
                      >
                        Eliminar
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
