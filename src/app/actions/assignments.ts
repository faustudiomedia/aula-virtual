'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type Result = { success: true } | { success: false; error: string }

export async function createAssignment(courseId: string, formData: FormData): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'profesor' && profile?.role !== 'super_admin')
    return { success: false, error: 'Sin permisos' }

  const title = (formData.get('title') as string | null)?.trim()
  const description = (formData.get('description') as string | null)?.trim() ?? ''
  const dueDateStr = (formData.get('due_date') as string | null)?.trim() || null
  const maxScore = parseInt(formData.get('max_score') as string) || 100

  if (!title) return { success: false, error: 'El título es requerido' }

  const { error } = await supabase.from('assignments').insert({
    course_id: courseId,
    title,
    description,
    due_date: dueDateStr,
    max_score: maxScore,
  })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function deleteAssignment(assignmentId: string): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const { error } = await supabase
    .from('assignments').delete().eq('id', assignmentId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function submitAssignment(assignmentId: string, formData: FormData): Promise<Result> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const content = (formData.get('content') as string | null)?.trim() ?? ''
  const fileUrl = (formData.get('file_url') as string | null)?.trim() || null

  if (!content && !fileUrl)
    return { success: false, error: 'Debés escribir una respuesta o adjuntar un archivo' }

  const { error } = await supabase.from('submissions').upsert(
    {
      assignment_id: assignmentId,
      student_id: user.id,
      content,
      file_url: fileUrl,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: 'assignment_id,student_id' },
  )

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function gradeSubmission(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'profesor' && profile?.role !== 'super_admin') redirect('/dashboard')

  const submissionId = formData.get('submission_id') as string
  const assignmentId = formData.get('assignment_id') as string
  const courseId = formData.get('course_id') as string
  const score = parseInt(formData.get('score') as string)
  const feedback = (formData.get('feedback') as string | null)?.trim() ?? ''

  if (!isNaN(score) && score >= 0) {
    await supabase.from('submissions').update({
      score,
      feedback,
      graded_at: new Date().toISOString(),
    }).eq('id', submissionId)
  }

  redirect(`/dashboard/teacher/courses/${courseId}/assignments/${assignmentId}?success=1`)
}
