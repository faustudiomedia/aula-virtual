'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createThread(courseId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  if (!title?.trim() || !content?.trim()) return

  await supabase.from('forum_threads').insert({
    course_id: courseId,
    author_id: user.id,
    title: title.trim(),
    content: content.trim(),
  })

  revalidatePath(`/dashboard/teacher/courses/${courseId}/forum`)
  revalidatePath(`/dashboard/student/courses/${courseId}/forum`)
}

export async function deleteThread(threadId: string, courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).maybeSingle()

  // Only author, course teacher, admin, or super_admin can delete
  const { data: thread } = await supabase
    .from('forum_threads').select('author_id, course_id').eq('id', threadId).maybeSingle()
  if (!thread) return

  const { data: course } = await supabase
    .from('courses').select('teacher_id').eq('id', thread.course_id).maybeSingle()

  const isAuthor = thread.author_id === user.id
  const isTeacher = course?.teacher_id === user.id
  const isPrivileged = profile?.role === 'admin' || profile?.role === 'super_admin'

  if (!isAuthor && !isTeacher && !isPrivileged) return

  await supabase.from('forum_threads').delete().eq('id', threadId)

  revalidatePath(`/dashboard/teacher/courses/${courseId}/forum`)
  revalidatePath(`/dashboard/student/courses/${courseId}/forum`)
}

export async function togglePinThread(threadId: string, pinned: boolean, courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Only course teacher or admin/super_admin can pin
  const { data: course } = await supabase
    .from('courses').select('teacher_id').eq('id', courseId).maybeSingle()
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).maybeSingle()

  const isTeacher = course?.teacher_id === user.id
  const isPrivileged = profile?.role === 'admin' || profile?.role === 'super_admin'
  if (!isTeacher && !isPrivileged) return

  await supabase.from('forum_threads').update({ pinned: !pinned }).eq('id', threadId)

  revalidatePath(`/dashboard/teacher/courses/${courseId}/forum`)
  revalidatePath(`/dashboard/student/courses/${courseId}/forum`)
}

export async function createReply(threadId: string, courseId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const content = formData.get('content') as string
  if (!content?.trim()) return

  await supabase.from('forum_replies').insert({
    thread_id: threadId,
    author_id: user.id,
    content: content.trim(),
  })

  revalidatePath(`/dashboard/teacher/courses/${courseId}/forum/${threadId}`)
  revalidatePath(`/dashboard/student/courses/${courseId}/forum/${threadId}`)
}

export async function deleteReply(replyId: string, threadId: string, courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).maybeSingle()

  const { data: reply } = await supabase
    .from('forum_replies').select('author_id').eq('id', replyId).maybeSingle()
  if (!reply) return

  const isAuthor = reply.author_id === user.id
  const isPrivileged = profile?.role === 'admin' || profile?.role === 'super_admin'
  if (!isAuthor && !isPrivileged) return

  await supabase.from('forum_replies').delete().eq('id', replyId)

  revalidatePath(`/dashboard/teacher/courses/${courseId}/forum/${threadId}`)
  revalidatePath(`/dashboard/student/courses/${courseId}/forum/${threadId}`)
}
