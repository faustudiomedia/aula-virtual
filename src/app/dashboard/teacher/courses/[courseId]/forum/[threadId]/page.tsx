import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CourseNavTabs } from '@/components/ui/CourseNavTabs'
import { createReply, deleteReply } from '@/app/actions/forum'
import { ForumDeleteButton } from './ForumDeleteButton'

interface Props { params: Promise<{ courseId: string; threadId: string }> }

export default async function TeacherThreadPage({ params }: Props) {
  const { courseId, threadId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'profesor' && profile?.role !== 'super_admin') redirect('/dashboard')

  const { data: course } = await supabase
    .from('courses').select('id, title, teacher_id').eq('id', courseId).single()
  if (!course) redirect('/dashboard/teacher')

  const { data: thread } = await supabase
    .from('forum_threads')
    .select('id, title, content, pinned, created_at, author_id, profiles(full_name)')
    .eq('id', threadId)
    .single()
  if (!thread) redirect(`/dashboard/teacher/courses/${courseId}/forum`)

  const { data: replies } = await supabase
    .from('forum_replies')
    .select('id, content, created_at, author_id, profiles(full_name)')
    .eq('thread_id', threadId)
    .order('created_at')

  const isTeacher = course.teacher_id === user.id || profile?.role === 'super_admin'
  const threadAuthor = thread.profiles as unknown as { full_name: string } | null

  async function handleReply(formData: FormData) {
    'use server'
    await createReply(threadId, courseId, formData)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--ag-text)] mb-1">{course.title}</h1>
      <CourseNavTabs courseId={courseId} />

      <Link
        href={`/dashboard/teacher/courses/${courseId}/forum`}
        className="inline-flex items-center gap-1 text-sm text-[var(--ag-text-muted)] hover:text-[var(--ag-navy)] mb-5"
      >
        ← Volver al foro
      </Link>

      {/* Thread */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 mb-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {thread.pinned && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100/60 text-amber-600">📌 Fijado</span>}
              <h2 className="text-xl font-bold text-[var(--ag-text)]">{thread.title}</h2>
            </div>
            <p className="text-xs text-[var(--ag-text-muted)]">
              {threadAuthor?.full_name ?? 'Desconocido'} · {new Date(thread.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          {isTeacher && (
            <ForumDeleteButton threadId={threadId} courseId={courseId} />
          )}
        </div>
        <p className="text-sm text-[var(--ag-text)]/80 whitespace-pre-wrap">{thread.content}</p>
      </div>

      {/* Replies */}
      <div className="space-y-3 mb-6">
        {(replies ?? []).map(r => {
          const author = r.profiles as unknown as { full_name: string } | null
          const canDelete = r.author_id === user.id || isTeacher
          return (
            <div key={r.id} className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs font-medium text-[var(--ag-text-muted)] mb-2">
                    {author?.full_name ?? 'Desconocido'} · {new Date(r.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-sm text-[var(--ag-text)]/80 whitespace-pre-wrap">{r.content}</p>
                </div>
                {canDelete && (
                  <form action={deleteReply.bind(null, r.id, threadId, courseId)}>
                    <button
                      type="submit"
                      className="text-xs px-2.5 py-1 rounded-lg border border-black/10 text-[var(--ag-text-muted)] hover:bg-red-50 hover:text-red-500 transition-all flex-shrink-0"
                    >
                      ✕
                    </button>
                  </form>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Reply form */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-[var(--ag-text)] mb-3">Responder</h3>
        <form action={handleReply} className="space-y-3">
          <textarea
            name="content"
            required
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 resize-none"
            placeholder="Escribe tu respuesta..."
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[var(--ag-navy)] text-white text-sm font-medium hover:bg-[var(--ag-navy)]/90 transition-all"
          >
 