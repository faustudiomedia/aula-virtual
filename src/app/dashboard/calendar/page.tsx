import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CalendarView, type CalendarAssignment, type CalendarMeeting } from '@/components/ui/CalendarView'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, institute_id').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const role = profile.role === 'profesor' ? 'teacher' : 'student'
  let assignments: CalendarAssignment[] = []
  let meetings: CalendarMeeting[] = []

  if (profile.role === 'alumno') {
    // Alumno: tareas con fecha de entrega de sus cursos inscriptos
    const { data: enrollments } = await supabase
      .from('enrollments').select('course_id').eq('student_id', user.id)
    const courseIds = (enrollments ?? []).map((e: { course_id: string }) => e.course_id)

    if (courseIds.length > 0) {
      const { data: assignmentRows } = await supabase
        .from('assignments')
        .select('id, title, due_date, course_id, courses(title)')
        .in('course_id', courseIds)
        .not('due_date', 'is', null)
        .order('due_date')

      const { data: submissionRows } = await supabase
        .from('submissions')
        .select('assignment_id, score, graded_at')
        .eq('student_id', user.id)

      const submissionMap = new Map(
        (submissionRows ?? []).map((s: { assignment_id: string; score: number | null; graded_at: string | null }) => [s.assignment_id, s])
      )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assignments = (assignmentRows ?? []).map((a: any) => {
        const sub = submissionMap.get(a.id)
        return {
          id: a.id,
          title: a.title,
          courseId: a.course_id,
          courseTitle: (a.courses as { title: string } | null)?.title ?? '',
          dueDate: a.due_date,
          submitted: !!sub,
          graded: !!sub?.graded_at,
          score: sub?.score ?? null,
        }
      })

      const { data: meetingRows } = await supabase
        .from('meetings')
        .select('id, display_name, scheduled_at')
        .in('course_id', courseIds)
        .order('scheduled_at')

      meetings = (meetingRows ?? []).map((m: { id: string; display_name: string; scheduled_at: string }) => ({
        id: m.id,
        displayName: m.display_name,
        scheduledAt: m.scheduled_at,
      }))
    }
  } else if (profile.role === 'profesor') {
    const { data: courses } = await supabase
      .from('courses').select('id').eq('teacher_id', user.id)
    const courseIds = (courses ?? []).map((c: { id: string }) => c.id)

    if (courseIds.length > 0) {
      const { data: assignmentRows } = await supabase
        .from('assignments')
        .select('id, title, due_date, course_id, courses(title)')
        .in('course_id', courseIds)
        .not('due_date', 'is', null)
        .order('due_date')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assignments = (assignmentRows ?? []).map((a: any) => ({
        id: a.id,
        title: a.title,
        courseId: a.course_id,
        courseTitle: Array.isArray(a.courses) ? (a.courses[0]?.title ?? '') : (a.courses?.title ?? ''),
        dueDate: a.due_date,
      }))

      const { data: meetingRows } = await supabase
        .from('meetings')
        .select('id, display_name, scheduled_at')
        .in('course_id', courseIds)
        .order('scheduled_at')

      meetings = (meetingRows ?? []).map((m: { id: string; display_name: string; scheduled_at: string }) => ({
        id: m.id,
        displayName: m.display_name,
        scheduledAt: m.scheduled_at,
      }))
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--ag-text)]">📅 Calendario</h1>
        <p className="text-[var(--ag-text-muted)] mt-1">Tareas, reuniones y fechas de entrega.</p>
      </div>
      <CalendarView
        assignments={assignments}
        role={role}
        meetings={meetings}
      />
    </div>
  )
}
