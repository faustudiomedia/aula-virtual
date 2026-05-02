import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CourseNavTabs } from '@/components/ui/CourseNavTabs'
import { createThread } from '@/app/actions/forum'
import { ForumThreadActions } from './ForumThreadActions'

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
      <h1 className="text-2xl font-bold text-[var(--ag-text)] mb-1">{course.title}</h1>
      <CourseNavTabs courseId={courseId} />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-[var(--ag-text)]">Foro del curso</h2>
        <Link
          href={`/dashboard/teacher/courses/${courseId}/forum/new`}
          className="px-4 py-2 rounded-xl bg-[var(--ag-navy)] text-white text-sm font-medium hover:bg-[var(--ag-navy)]/90 transition-all"
        >
          + Nuevo tema
        </Link>
      </div>

      {(!threads || threads.length === 0) ? (
        <div className="text-center py-16 text-[var(--ag-text-muted)]">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-sm">No hay temas en el foro todavía.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((t) => {
            const author = t.profiles as unknown as { full_name: string } | null
            return (
              <div key={t.id} className="bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] shadow-sm p-5 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {t.pinned && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100/60 text-amber-600 font-medium">📌 Fijado</span>
                    )}
                    <Link
                      href={`/dashboard/teacher/courses/${courseId}/forum/${t.id}`}
                      className="text-base font-semibold text-[var(--ag-text)] hover:text-[var(--ag-navy)] transition-colors truncate"
                    >
                      {t.title}
                    </Link>
                  </div>
                  <p className="text-sm text-[var(--ag-text-muted)] line-clamp-2">{t.content}</p>
                  <p className="text-xs text-[var(--ag-text)]/30 mt-2">
                    {author?.full_name ?? 'Desconocido'} · {new Date(t.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                {isTeacher && (
                  <ForumThreadActions
                    threadId={t.id}
                    courseId={courseId}
                    pinned={t.pinned}
                  />
                )}
              </div>
       
