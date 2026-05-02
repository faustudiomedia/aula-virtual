import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CourseNavTabs } from '@/components/ui/CourseNavTabs'
import AttendanceView from './AttendanceView'

interface Props {
  params: Promise<{ courseId: string }>
}

export default async function AttendancePage({ params }: Props) {
  const { courseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'profesor' && profile?.role !== 'super_admin') redirect('/dashboard')

  const { data: course } = await supabase
    .from('courses').select('title, teacher_id').eq('id', courseId).single()
  if (!course) redirect('/dashboard/teacher')

  // Fetch enrolled students
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('student_id, profiles(id, full_name, email, legajo)')
    .eq('course_id', courseId)

  const students = (enrollments ?? []).map((e: {
    student_id: string
    profiles: { id: string; full_name: string; email: string; legajo: string | null } | null
  }) => ({
    id: e.student_id,
    fullName: e.profiles?.full_name ?? 'Sin nombre',
    email: e.profiles?.email ?? '',
    legajo: e.profiles?.legajo ?? null,
  }))

  // Fetch past sessions with records count
  const { data: sessions } = await supabase
    .from('attendance_sessions')
    .select('id, session_date, topic, created_at')
    .eq('course_id', courseId)
    .order('session_date', { ascending: false })

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-2">
        <Link href="/dashboard/teacher" className="text-sm text-[var(--ag-text-muted)] hover:text-[var(--ag-text)] transition-colors">
          ← Mis cursos
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[var(--ag-text)] mb-6">{course.title}</h1>
      <CourseNavTabs courseId={courseId} />
      <AttendanceView
        courseId={courseId}
        students={students}
        sessions={sessions ?? []}
      />
    </div>
  )
}
