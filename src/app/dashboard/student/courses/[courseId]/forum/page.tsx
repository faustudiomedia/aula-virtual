import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { DiscussionThread, DiscussionReply } from '@/lib/types'
import ForumView from '@/components/ui/ForumView'

interface Props { params: Promise<{ courseId: string }> }

export default async function StudentForumPage({ params }: Props) {
  const { courseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verificar inscripción
  const { data: enrollment } = await supabase
    .from('enrollments').select('id, courses(title)')
    .eq('student_id', user.id).eq('course_id', courseId).single()
  if (!enrollment) notFound()
  const courseTitle = (enrollment.courses as unknown as { title: string })?.title ?? 'Curso'

  // Threads
  const { data: threads } = await supabase
    .from('discussion_threads')
    .select('*, author:profiles!discussion_threads_author_id_fkey(full_name, email, role, avatar_url)')
    .eq('course_id', courseId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  const threadList = (threads ?? []) as unknown as DiscussionThread[]
  const threadIds = threadList.map(t => t.id)

  // Replies
  const { data: replies } = threadIds.length > 0
    ? await supabase
        .from('discussion_replies')
        .select('*, author:profiles!discussion_replies_author_id_fkey(full_name, email, role, avatar_url)')
        .in('thread_id', threadIds)
        .order('created_at', { ascending: true })
    : { data: [] }

  const repliesByThread: Record<string, DiscussionReply[]> = {}
  ;(replies ?? []).forEach((r: unknown) => {
    const reply = r as DiscussionReply
    if (!repliesByThread[reply.thread_id]) repliesByThread[reply.thread_id] = []
    repliesByThread[reply.thread_id].push(reply)
  })

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-[#050F1F]/50 mb-6">
        <Link href={`/dashboard/student/courses/${courseId}`} className="hover:text-[#1A56DB] transition-colors">
          {courseTitle}
        </Link>
        <span>/</span>
        <span className="text-[#050F1F] font-medium">Foro</span>
      </div>
      <ForumView threads={threadList} repliesByThread={repliesByThread} courseId={courseId} courseTitle={courseTitle} />
    </div>
  )
}
