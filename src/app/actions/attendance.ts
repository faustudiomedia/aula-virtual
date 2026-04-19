'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ActionState = {
  success?: boolean
  error?: string
  sessionId?: string
}

export async function createAttendanceSession(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const courseId = formData.get('course_id') as string
  const sessionDate = formData.get('session_date') as string
  const topic = (formData.get('topic') as string)?.trim() || null

  if (!courseId || !sessionDate) return { error: 'Datos incompletos' }

  // Verify teacher owns the course
  const { data: course } = await supabase
    .from('courses').select('teacher_id').eq('id', courseId).single()
  if (course?.teacher_id !== user.id) return { error: 'Sin permisos' }

  // Create session
  const { data: session, error: sessionError } = await supabase
    .from('attendance_sessions')
    .insert({ course_id: courseId, session_date: sessionDate, topic, created_by: user.id })
    .select('id').single()

  if (sessionError) return { error: sessionError.message }

  // Get enrolled students and create absent records by default
  const { data: enrollments } = await supabase
    .from('enrollments').select('student_id').eq('course_id', courseId)

  if (enrollments && enrollments.length > 0) {
    const records = enrollments.map((e: { student_id: string }) => ({
      session_id: session.id,
      student_id: e.student_id,
      status: 'absent',
    }))
    await supabase.from('attendance_records').insert(records)
  }

  revalidatePath(`/dashboard/teacher/courses/${courseId}/attendance`)
  return { success: true, sessionId: session.id }
}

export async function saveAttendanceRecords(
  sessionId: string,
  courseId: string,
  records: { studentId: string; status: string; notes?: string }[]
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  // Verify teacher owns the course
  const { data: course } = await supabase
    .from('courses').select('teacher_id').eq('id', courseId).single()
  if (course?.teacher_id !== user.id) return { error: 'Sin permisos' }

  const upserts = records.map(r => ({
    session_id: sessionId,
    student_id: r.studentId,
    status: r.status,
    notes: r.notes ?? null,
  }))

  const { error } = await supabase
    .from('attendance_records')
    .upsert(upserts, { onConflict: 'session_id,student_id' })

  if (error) return { error: error.message }
  revalidatePath(`/dashboard/teacher/courses/${courseId}/attendance`)
  return { success: true }
}
