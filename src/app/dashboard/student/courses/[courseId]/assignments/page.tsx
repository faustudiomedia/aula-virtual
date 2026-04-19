import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Assignment, Submission } from '@/lib/types'
import AssignmentManager from '@/components/ui/AssignmentManager'

interface Props { params: Promise<{ courseId: string }> }

export default async function StudentAssignmentsPage({ params }: Props) {
  const { courseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verificar inscripción
  const { data: enrollment } = await supabase
    .from('enrollments').select('id, courses(title)')
    .eq('student_id', user.id).eq('course_id', courseId).single()
  
  if (!enrollment) notFound()
  const courseTitle = (enrollment.courses as unknown as { title: string })?.title ?? 'Curso'

  // Fetch Assignments
  const { data: assignments } = await supabase
    .from('assignments').select('*').eq('course_id', courseId).order('due_date', { ascending: true })
  const assignmentList = (assignments ?? []) as Assignment[]

  // Fetch my submissions
  const assignmentIds = assignmentList.map(a => a.id)
  const { data: mySubmissions } = assignmentIds.length > 0
    ? await supabase.from('submissions').select('*').in('assignment_id', assignmentIds).eq('student_id', user.id)
    : { data: [] }
    
  const submissionsMap: Record<string, Submission> = {}
  ;(mySubmissions ?? []).forEach((sub: unknown) => {
     const s = sub as Submission & { assignment_id: string }
     submissionsMap[s.assignment_id] = s
  })

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-[#050F1F]/50 mb-6">
        <Link href={`/dashboard/student/courses/${courseId}`} className="hover:text-[#1A56DB] transition-colors">{courseTitle}</Link>
        <span>/</span>
        <span className="text-[#050F1F] font-medium">Trabajos Prácticos</span>
      </div>
      
      <AssignmentManager
        assignments={assignmentList}
        courseId={courseId}
        courseTitle={courseTitle}
        isTeacher={false}
        studentSubmissions={submissionsMap}
      />
    </div>
  )
}
