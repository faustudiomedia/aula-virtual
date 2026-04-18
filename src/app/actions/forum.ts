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

  await supabase.from('forum_threads').delete().eq('id', threadId)

  revalidatePath(`/dashboard/teacher/courses/${courseId}/forum`)
  revalidatePath(`/dashboard/student/courses/${courseId}/forum`)
}

export async function togglePinThread(threadId: string, pinned: boolean, courseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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

  await supabase.from('forum_replies').delete().eq('id', replyId)

  revalidatePath(`/dashboard/teacher/courses/${courseId}/forum/${threadId}`)
  revalidatePath(`/dashboard/student/courses/${courseId}/forum/${threadId}`)
}
