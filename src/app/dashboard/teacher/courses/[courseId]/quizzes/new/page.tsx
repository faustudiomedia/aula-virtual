import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import QuizEditor from '@/components/ui/QuizEditor'

interface Props {
  params: Promise<{ courseId: string }>
}

export default async function NewQuizPage({ params }: Props) {
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

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-[var(--ag-text-muted)] mb-6">
        <Link href={`/dashboard/teacher/courses/${courseId}/quizzes`} className="hover:text-[var(--ag-navy)] transition-colors">
          ← Quizzes de {course.title}
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-[var(--ag-text)] mb-2">Nuevo quiz</h1>
      <p className="text-[var(--ag-text-muted)] mb-8">Construí las preguntas y marcá las respuestas correctas.</p>

      <QuizEditor courseId={courseId} />
    </div>
  )
}
