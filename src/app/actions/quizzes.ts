'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import type { ActionState } from './courses'
import type { QuizQuestion } from '@/lib/types'
import { logAction } from '@/app/actions/audit'

const quizSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres').max(200),
  content: z.array(z.object({
    id: z.string(),
    question: z.string().min(5, 'La pregunta es demasiado corta'),
    options: z.array(z.string().min(1, 'Las opciones no pueden estar vacías')).min(2, 'Mínimo 2 opciones').max(6),
    correct: z.number().min(0),
  })).min(1, 'El quiz debe tener al menos una pregunta'),
})

// ── Helpers de autenticación ─────────────────────────────────────
async function getTeacherProfile() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { supabase: null, user: null, profile: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, institute_id')
    .eq('id', user.id)
    .single()

  return { supabase, user, profile }
}

// ── Verificar que el quiz pertenece al profesor ──────────────────
async function verifyQuizOwnership(supabase: Awaited<ReturnType<typeof createClient>>, quizId: string, teacherId: string): Promise<boolean> {
  // Step 1: get course_id of the quiz
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('course_id')
    .eq('id', quizId)
    .single()

  if (!quiz?.course_id) return false

  // Step 2: verify the teacher owns the course
  const { data: course } = await supabase
    .from('courses')
    .select('teacher_id')
    .eq('id', quiz.course_id)
    .single()

  return (course as { teacher_id: string } | null)?.teacher_id === teacherId
}

// ── Crear quiz ───────────────────────────────────────────────────
export async function createQuiz(courseId: string, content: QuizQuestion[], prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { supabase, user, profile } = await getTeacherProfile()
    if (!supabase || !user || !profile) return { success: false, error: 'No autenticado' }
    if (profile.role !== 'profesor') return { success: false, error: 'Sin permisos' }

    const parsed = quizSchema.safeParse({
      title: formData.get('title'),
      content,
    })

    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    const { error } = await supabase
      .from('quizzes')
      .insert({
        course_id: courseId,
        title: parsed.data.title,
        content: parsed.data.content,
        is_published: false,
      })

    if (error) return { success: false, error: error.message }

    // 📋 Audit log
    await logAction(user.id, 'quiz', null, 'CREATE', { title: parsed.data.title, courseId })

    revalidatePath(`/dashboard/teacher/courses/${courseId}/quizzes`)
    return { success: true }
  } catch {
    return { success: false, error: 'Error inesperado al crear el quiz' }
  }
}

// ── Actualizar quiz ──────────────────────────────────────────────
export async function updateQuiz(quizId: string, content: QuizQuestion[], prevState: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { supabase, user, profile } = await getTeacherProfile()
    if (!supabase || !user || !profile) return { success: false, error: 'No autenticado' }
    if (profile.role !== 'profesor') return { success: false, error: 'Sin permisos' }

    const isOwner = await verifyQuizOwnership(supabase, quizId, user.id)
    if (!isOwner) return { success: false, error: 'No tenés permiso para editar este quiz' }

    const parsed = quizSchema.safeParse({
      title: formData.get('title'),
      content,
    })

    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

    const { data: existing } = await supabase
      .from('quizzes')
      .select('course_id')
      .eq('id', quizId)
      .single()

    const { error } = await supabase
      .from('quizzes')
      .update({
        title: parsed.data.title,
        content: parsed.data.content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', quizId)

    if (error) return { success: false, error: error.message }
    if (existing?.course_id) revalidatePath(`/dashboard/teacher/courses/${existing.course_id}/quizzes`)
    return { success: true }
  } catch {
    return { success: false, error: 'Error inesperado al actualizar el quiz' }
  }
}

// ── Eliminar quiz ────────────────────────────────────────────────
export async function deleteQuiz(quizId: string): Promise<ActionState> {
  try {
    const { supabase, user, profile } = await getTeacherProfile()
    if (!supabase || !user || !profile) return { success: false, error: 'No autenticado' }
    if (profile.role !== 'profesor') return { success: false, error: 'Sin permisos' }

    const isOwner = await verifyQuizOwnership(supabase, quizId, user.id)
    if (!isOwner) return { success: false, error: 'No tenés permiso para eliminar este quiz' }

    const { data: existing } = await supabase.from('quizzes').select('course_id').eq('id', quizId).single()
    const { error } = await supabase.from('quizzes').delete().eq('id', quizId)

    if (error) return { success: false, error: error.message }
    if (existing?.course_id) revalidatePath(`/dashboard/teacher/courses/${existing.course_id}/quizzes`)
    return { success: true }
  } catch {
    return { success: false, error: 'Error al eliminar el quiz' }
  }
}

// ── Publicar / Despublicar quiz ──────────────────────────────────
export async function toggleQuizPublished(quizId: string, currentState: boolean): Promise<ActionState> {
  try {
    const { supabase, user, profile } = await getTeacherProfile()
    if (!supabase || !user || !profile) return { success: false, error: 'No autenticado' }
    if (profile.role !== 'profesor') return { success: false, error: 'Sin permisos' }

    const isOwner = await verifyQuizOwnership(supabase, quizId, user.id)
    if (!isOwner) return { success: false, error: 'Sin permisos' }

    const { data: existing } = await supabase.from('quizzes').select('course_id').eq('id', quizId).single()
    const { error } = await supabase
      .from('quizzes')
      .update({ is_published: !currentState })
      .eq('id', quizId)

    if (error) return { success: false, error: error.message }
    if (existing?.course_id) revalidatePath(`/dashboard/teacher/courses/${existing.course_id}/quizzes`)
    return { success: true }
  } catch {
    return { success: false, error: 'Error al cambiar el estado del quiz' }
  }
}

// ── Enviar intento de quiz (alumno) ──────────────────────────────
export async function submitQuizAttempt(quizId: string, answers: number[]): Promise<ActionState & { score?: number }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return { success: false, error: 'No autenticado' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'alumno') return { success: false, error: 'Solo los alumnos pueden realizar quizzes' }

    // Obtener el quiz con las respuestas correctas
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('content, course_id')
      .eq('id', quizId)
      .single()

    if (!quiz) return { success: false, error: 'Quiz no encontrado' }

    const questions = quiz.content as QuizQuestion[]
    if (answers.length !== questions.length) {
      return { success: false, error: 'Debés responder todas las preguntas' }
    }

    // Calcular score
    const correct = answers.filter((ans, idx) => ans === questions[idx].correct).length
    const score = Math.round((correct / questions.length) * 100)

    // Verificar si ya existe un intento previo
    const { data: existingAttempt } = await supabase
      .from('quiz_attempts')
      .select('id')
      .eq('quiz_id', quizId)
      .eq('student_id', user.id)
      .single()

    if (existingAttempt) {
      // Actualizar intento existente (solo guardar el mejor score, o el último)
      await supabase
        .from('quiz_attempts')
        .update({ answers, score, completed_at: new Date().toISOString() })
        .eq('id', existingAttempt.id)
    } else {
      // Insertar nuevo intento
      await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quizId,
          student_id: user.id,
          answers,
          score,
          completed_at: new Date().toISOString(),
        })
    }

    revalidatePath(`/dashboard/student/courses`)
    return { success: true, score }
  } catch {
    return { success: false, error: 'Error al enviar el intento' }
  }
}
