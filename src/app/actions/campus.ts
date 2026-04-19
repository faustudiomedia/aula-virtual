'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logAction } from '@/app/actions/audit'

type Result = { success: boolean; error?: string }

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ANUNCIOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function createAnnouncement(courseId: string, title: string, body: string): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }
  if (!title.trim() || !body.trim()) return { success: false, error: 'Título y contenido son requeridos' }

  // Verificar que es profesor del curso
  const { data: course } = await supabase.from('courses').select('id').eq('id', courseId).eq('teacher_id', user.id).single()
  if (!course) return { success: false, error: 'No sos profesor de este curso' }

  const { data: ann, error } = await supabase.from('announcements').insert({
    course_id: courseId, author_id: user.id, title: title.trim(), body: body.trim(),
  }).select('id').single()

  if (error) return { success: false, error: error.message }
  await logAction(user.id, 'announcement', ann?.id ?? null, 'CREATE', { title, courseId })
  revalidatePath(`/dashboard/teacher/courses/${courseId}`)
  revalidatePath(`/dashboard/student/courses/${courseId}`)
  return { success: true }
}

export async function deleteAnnouncement(announcementId: string, courseId: string): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { error } = await supabase.from('announcements').delete().eq('id', announcementId).eq('author_id', user.id)
  if (error) return { success: false, error: error.message }
  await logAction(user.id, 'announcement', announcementId, 'DELETE')
  revalidatePath(`/dashboard/teacher/courses/${courseId}`)
  return { success: true }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FORO DE DISCUSIÓN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function createThread(courseId: string, title: string, body: string): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }
  if (!title.trim() || !body.trim()) return { success: false, error: 'Título y contenido son requeridos' }

  const { data: thread, error } = await supabase.from('discussion_threads').insert({
    course_id: courseId, author_id: user.id, title: title.trim(), body: body.trim(),
  }).select('id').single()

  if (error) return { success: false, error: error.message }
  await logAction(user.id, 'thread', thread?.id ?? null, 'CREATE', { title, courseId })
  revalidatePath(`/dashboard/student/courses/${courseId}/forum`)
  revalidatePath(`/dashboard/teacher/courses/${courseId}/forum`)
  return { success: true }
}

export async function createReply(threadId: string, courseId: string, body: string): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }
  if (!body.trim()) return { success: false, error: 'El mensaje no puede estar vacío' }

  const { error } = await supabase.from('discussion_replies').insert({
    thread_id: threadId, author_id: user.id, body: body.trim(),
  })

  if (error) return { success: false, error: error.message }
  revalidatePath(`/dashboard/student/courses/${courseId}/forum`)
  revalidatePath(`/dashboard/teacher/courses/${courseId}/forum`)
  return { success: true }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EVENTOS / CALENDARIO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function createEvent(
  courseId: string, title: string, description: string,
  eventType: string, startAt: string, endAt?: string
): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }
  if (!title.trim() || !startAt) return { success: false, error: 'Título y fecha son requeridos' }

  const { data: course } = await supabase.from('courses').select('id').eq('id', courseId).eq('teacher_id', user.id).single()
  if (!course) return { success: false, error: 'No sos profesor de este curso' }

  const { data: evt, error } = await supabase.from('events').insert({
    course_id: courseId, author_id: user.id,
    title: title.trim(), description: description.trim() || null,
    event_type: eventType || 'clase',
    start_at: startAt, end_at: endAt || null,
  }).select('id').single()

  if (error) return { success: false, error: error.message }
  await logAction(user.id, 'event', evt?.id ?? null, 'CREATE', { title, courseId, eventType })
  revalidatePath('/dashboard/calendar')
  return { success: true }
}

export async function deleteEvent(eventId: string): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { error } = await supabase.from('events').delete().eq('id', eventId).eq('author_id', user.id)
  if (error) return { success: false, error: error.message }
  await logAction(user.id, 'event', eventId, 'DELETE')
  revalidatePath('/dashboard/calendar')
  return { success: true }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TRABAJOS PRÁCTICOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function createAssignment(
  courseId: string, title: string, description: string, dueDate?: string, maxScore?: number
): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }
  if (!title.trim()) return { success: false, error: 'El título es requerido' }

  const { data: course } = await supabase.from('courses').select('id').eq('id', courseId).eq('teacher_id', user.id).single()
  if (!course) return { success: false, error: 'No sos profesor de este curso' }

  const { data: assignment, error } = await supabase.from('assignments').insert({
    course_id: courseId, author_id: user.id,
    title: title.trim(), description: description.trim() || null,
    due_date: dueDate || null, max_score: maxScore ?? 100,
  }).select('id').single()

  if (error) return { success: false, error: error.message }
  await logAction(user.id, 'assignment', assignment?.id ?? null, 'CREATE', { title, courseId })
  revalidatePath(`/dashboard/teacher/courses/${courseId}/assignments`)
  revalidatePath(`/dashboard/student/courses/${courseId}`)
  return { success: true }
}

export async function submitAssignment(assignmentId: string, comment: string, fileUrl?: string): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { error } = await supabase.from('submissions').upsert({
    assignment_id: assignmentId,
    student_id: user.id,
    comment: comment.trim() || null,
    file_url: fileUrl || null,
    submitted_at: new Date().toISOString(),
  }, { onConflict: 'assignment_id,student_id' })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function gradeSubmission(submissionId: string, score: number, feedback: string): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'profesor') return { success: false, error: 'Solo profesores pueden calificar' }

  const { error } = await supabase.from('submissions').update({
    score, feedback: feedback.trim() || null, graded_at: new Date().toISOString(),
  }).eq('id', submissionId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
