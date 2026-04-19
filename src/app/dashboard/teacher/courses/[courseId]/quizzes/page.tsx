import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Quiz } from '@/lib/types'
import { DeleteQuizButton, ToggleQuizButton } from '@/components/ui/QuizActions'

interface Props {
  params: Promise<{ courseId: string }>
}

export default async function TeacherQuizzesPage({ params }: Props) {
  const { courseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'profesor') redirect('/dashboard')

  const { data: course } = await supabase
    .from('courses')
    .select('id, title')
    .eq('id', courseId)
    .eq('teacher_id', user.id)
    .single()

  if (!course) notFound()

  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })

  const quizList = (quizzes ?? []) as Quiz[]

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#050F1F]/50 mb-6">
        <Link href="/dashboard/teacher" className="hover:text-[#1A56DB] transition-colors">Mis cursos</Link>
        <span>/</span>
        <Link href={`/dashboard/teacher/courses/${courseId}/materials`} className="hover:text-[#1A56DB] transition-colors truncate max-w-[200px]">
          {course.title}
        </Link>
        <span>/</span>
        <span className="text-[#050F1F] font-medium">Quizzes</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#050F1F]">Quizzes</h1>
          <p className="text-[#050F1F]/50 mt-1">{quizList.length} quiz{quizList.length !== 1 ? 'zes' : ''} en este curso</p>
        </div>
        <Link
          href={`/dashboard/teacher/courses/${courseId}/quizzes/new`}
          className="px-4 py-2.5 rounded-xl bg-[#1A56DB] text-white text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-[#1A56DB]/20"
        >
          + Nuevo quiz
        </Link>
      </div>

      {quizList.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#BAE6FD] p-12 text-center">
          <p className="text-4xl mb-3">🧠</p>
          <p className="text-[#050F1F]/50 mb-4">No hay quizzes en este curso todavía.</p>
          <Link
            href={`/dashboard/teacher/courses/${courseId}/quizzes/new`}
            className="inline-block px-4 py-2 rounded-xl bg-[#1A56DB] text-white text-sm font-semibold hover:opacity-90 transition"
          >
            Crear el primero
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {quizList.map((quiz) => {
            const questionCount = (quiz.content ?? []).length
            return (
              <div
                key={quiz.id}
                className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white text-lg flex-shrink-0">
                    🧠
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#050F1F] truncate">{quiz.title}</p>
                    <p className="text-xs text-[#050F1F]/50 mt-0.5">
                      {questionCount} pregunta{questionCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    quiz.is_published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {quiz.is_published ? 'Publicado' : 'Borrador'}
                  </span>

                  <ToggleQuizButton quizId={quiz.id} isPublished={quiz.is_published} />
                  <DeleteQuizButton quizId={quiz.id} quizTitle={quiz.title} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
