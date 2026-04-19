import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Assignment, Submission } from '@/lib/types'
import AssignmentManager from '@/components/ui/AssignmentManager'

interface Props { params: Promise<{ courseId: string }> }

export default async function TeacherAssignmentsPage({ params }: Props) {
  const { courseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: course } = await supabase
    .from('courses').select('title').eq('id', courseId).eq('teacher_id', user.id).single()
  if (!course) notFound()

  const { data: assignments } = await supabase
    .from('assignments').select('*').eq('course_id', courseId).order('created_at', { ascending: false })
  const assignmentList = (assignments ?? []) as Assignment[]

  // Get submissions for all assignments
  const assignmentIds = assignmentList.map(a => a.id)
  const { data: submissions } = assignmentIds.length > 0
    ? await supabase
        .from('submissions')
        .select('*, student:profiles!submissions_student_id_fkey(full_name, email)')
        .in('assignment_id', assignmentIds)
        .order('submitted_at', { ascending: false })
    : { data: [] }

  const submissionsByAssignment: Record<string, Submission[]> = {}
  ;(submissions ?? []).forEach((s: unknown) => {
    const sub = s as Submission & { assignment_id: string }
    if (!submissionsByAssignment[sub.assignment_id]) submissionsByAssignment[sub.assignment_id] = []
    submissionsByAssignment[sub.assignment_id].push(sub)
  })

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-[#050F1F]/50 mb-6">
        <Link href="/dashboard/teacher" className="hover:text-[#1A56DB] transition-colors">Mis cursos</Link>
        <span>/</span>
        <Link href={`/dashboard/teacher/courses/${courseId}/materials`} className="hover:text-[#1A56DB] transition-colors">{course.title}</Link>
        <span>/</span>
        <span className="text-[#050F1F] font-medium">Trabajos prácticos</span>
      </div>
      <AssignmentManager
        assignments={assignmentList}
        submissionsByAssignment={submissionsByAssignment}
        courseId={courseId}
        courseTitle={course.title}
        isTeacher={true}
      />
    </div>
  )
}
