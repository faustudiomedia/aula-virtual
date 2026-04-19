import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CourseNavTabs } from '@/components/ui/CourseNavTabs'

interface Props {
  params: Promise<{ courseId: string }>
}

export default async function GradebookPage({ params }: Props) {
  const { courseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'profesor' && profile?.role !== 'super_admin') redirect('/dashboard')

  const { data: course } = await supabase
    .from('courses').select('title').eq('id', courseId).single()
  if (!course) redirect('/dashboard/teacher')

  // Students
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('student_id, profiles(id, full_name, email, legajo)')
    .eq('course_id', courseId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const students = (enrollments ?? []).map((e: any) => ({
    id: e.student_id as string,
    fullName: (e.profiles?.full_name ?? 'Sin nombre') as string,
    legajo: (e.profiles?.legajo ?? null) as string | null,
  }))

  // Assignments
  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, title, max_score')
    .eq('course_id', courseId)
    .order('created_at')

  // Submissions
  const { data: submissions } = await supabase
    .from('submissions')
    .select('assignment_id, student_id, score, graded_at')
    .in('assignment_id', (assignments ?? []).map(a => a.id))

  // Quizzes
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id, title')
    .eq('course_id', courseId)
    .eq('is_published', true)
    .order('created_at')

  // Quiz attempts (best attempt per student per quiz)
  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('quiz_id, student_id, score')
    .in('quiz_id', (quizzes ?? []).map(q => q.id))

  // Build submission map: [studentId][assignmentId] = score
  const subMap: Record<string, Record<string, { score: number | null; graded: boolean }>> = {}
  for (const s of (submissions ?? [])) {
    if (!subMap[s.student_id]) subMap[s.student_id] = {}
    subMap[s.student_id][s.assignment_id] = { score: s.score, graded: !!s.graded_at }
  }

  // Build quiz map: [studentId][quizId] = best score
  const quizMap: Record<string, Record<string, number>> = {}
  for (const a of (attempts ?? [])) {
    if (!quizMap[a.student_id]) quizMap[a.student_id] = {}
    const prev = quizMap[a.student_id][a.quiz_id] ?? -1
    if (a.score > prev) quizMap[a.student_id][a.quiz_id] = a.score
  }

  const assignmentList = assignments ?? []
  const quizList = quizzes ?? []

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-2">
        <Link href="/dashboard/teacher" className="text-sm text-[#050F1F]/50 hover:text-[#050F1F] transition-colors">
          ← Mis cursos
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[#050F1F] mb-6">{course.title}</h1>
      <CourseNavTabs courseId={courseId} />

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-x-auto">
        {students.length === 0 ? (
          <p className="p-6 text-sm text-[#050F1F]/40">No hay alumnos inscriptos.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5">
                <th className="text-left px-4 py-3 font-semibold text-[#050F1F]/50 text-xs uppercase tracking-wider whitespace-nowrap">Alumno</th>
                {assignmentList.map(a => (
                  <th key={a.id} className="px-3 py-3 font-semibold text-[#050F1F]/50 text-xs uppercase tracking-wider text-center whitespace-nowrap max-w-[100px]">
                    <span className="block truncate" title={a.title}>{a.title}</span>
                    <span className="font-normal normal-case text-[10px]">/{a.max_score}</span>
                  </th>
                ))}
                {quizList.map(q => (
                  <th key={q.id} className="px-3 py-3 font-semibold text-[#050F1F]/50 text-xs uppercase tracking-wider text-center whitespace-nowrap max-w-[100px]">
                    <span className="block truncate" title={q.title}>{q.title}</span>
                    <span className="font-normal normal-case text-[10px]">Quiz</span>
                  </th>
                ))}
                <th className="px-4 py-3 font-semibold text-[#050F1F]/50 text-xs uppercase tracking-wider text-center">Promedio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {students.map(student => {
                const assignScores = assignmentList.map(a => {
                  const sub = subMap[student.id]?.[a.id]
                  if (!sub) return null
                  if (!sub.graded) return null
                  return sub.score !== null ? (sub.score / a.max_score) * 10 : null
                })
                const quizScores = quizList.map(q => {
                  const s = quizMap[student.id]?.[q.id]
                  return s !== undefined ? s : null
                })
                const allScores = [...assignScores, ...quizScores].filter((s): s is number => s !== null)
                const avg = allScores.length > 0
                  ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1)
                  : null

                return (
                  <tr key={student.id} className="hover:bg-black/[0.015] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#050F1F]">{student.fullName}</p>
                      {student.legajo && <p className="text-xs text-[#050F1F]/40">Leg. {student.legajo}</p>}
                    </td>
                    {assignmentList.map(a => {
                      const sub = subMap[student.id]?.[a.id]
                      if (!sub) return (
                        <td key={a.id} className="px-3 py-3 text-center">
                          <span className="text-xs text-[#050F1F]/30">—</span>
                        </td>
                      )
                      if (!sub.graded) return (
                        <td key={a.id} className="px-3 py-3 text-center">
                          <span className="text-xs text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">Pendiente</span>
                        </td>
                      )
                      const pct = sub.score !== null ? sub.score / a.max_score : null
                      const color = pct === null ? '' : pct >= 0.7 ? 'text-green-700' : pct >= 0.5 ? 'text-yellow-700' : 'text-red-700'
                      return (
                        <td key={a.id} className={`px-3 py-3 text-center font-medium ${color}`}>
                          {sub.score !== null ? sub.score : '—'}
                        </td>
                      )
                    })}
                    {quizList.map(q => {
                      const score = quizMap[student.id]?.[q.id]
                      if (score === undefined) return (
                        <td key={q.id} className="px-3 py-3 text-center">
                          <span className="text-xs text-[#050F1F]/30">—</span>
                        </td>
                      )
                      const color = score >= 7 ? 'text-green-700' : score >= 5 ? 'text-yellow-700' : 'text-red-700'
                      return (
                        <td key={q.id} className={`px-3 py-3 text-center font-medium ${color}`}>
                          {score}
                        </td>
                      )
                    })}
                    <td className="px-4 py-3 text-center">
                      {avg ? (
                        <span className={`font-semibold ${Number(avg) >= 7 ? 'text-green-700' : Number(avg) >= 5 ? 'text-yellow-700' : 'text-red-700'}`}>
                          {avg}
                        </span>
                      ) : (
                        <span className="text-xs text-[#050F1F]/30">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
