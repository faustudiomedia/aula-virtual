import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Quiz, QuizAttempt } from '@/lib/types'
import QuizPlayer from '@/components/ui/QuizPlayer'

interface Props {
  params: Promise<{ courseId: string; quizId: string }>
}

export default async function StudentQuizPage({ params }: Props) {
  const { courseId, quizId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'alumno') redirect('/dashboard')

  // Verificar inscripción al curso
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (!enrollment) redirect(`/dashboard/student/courses`)

  // Obtener el quiz
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .eq('is_published', true)
    .single()

  if (!quiz) notFound()

  // Intento previo del alumno
  const { data: attempt } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('quiz_id', quizId)
    .eq('student_id', user.id)
    .single()

  const quizData = quiz as Quiz
  const previousAttempt = attempt as QuizAttempt | null

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-[#050F1F]/50 mb-6">
        <Link href={`/dashboard/student/courses/${courseId}`} className="hover:text-[#1A56DB] transition-colors">
          ← Volver al curso
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#050F1F]">{quizData.title}</h1>
        <p className="text-[#050F1F]/50 mt-1">
          {quizData.content.length} pregunta{quizData.content.length !== 1 ? 's' : ''}
          {previousAttempt && (
            <span className="ml-2 text-violet-600 font-medium">
              · Intento anterior: {previousAttempt.score}%
            </span>
          )}
        </p>
      </div>

      <QuizPlayer
        quiz={quizData}
        courseId={courseId}
        previousAttempt={previousAttempt}
      />
    </div>
  )
}
