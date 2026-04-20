import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CalendarView } from '@/components/ui/CalendarView'
import type { CalendarAssignment, CalendarMeeting, CalendarEvent } from '@/components/ui/CalendarView'
import type { Assignment, Submission } from '@/lib/types'

export default async function StudentCalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, institute_id').eq('id', user.id).single()
  if (profile?.role !== 'alumno' && profile?.role !== 'super_admin') redirect('/dashboard')

  // All courses the student is enrolled in
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id, courses(id, title)')
    .eq('student_id', user.id)

  const courseIds = (enrollments ?? []).map((e: { course_id: string }) => e.course_id)

  const courseMap = new Map(
    (enrollments ?? []).map((e) => {
      const c = (e as unknown as { course_id: string; courses: { id: string; title: string } | null })
      return [c.course_id, c.courses?.title ?? 'Sin nombre']
    })
  )

  // Assignments for all enrolled courses (with due_date only)
  const { data: assignments } = courseIds.length
    ? await supabase
        .from('assignments')
        .select('*')
        .in('course_id', courseIds)
        .not('due_date', 'is', null)
        .order('due_date')
    : { data: [] }

  const assignmentIds = (assignments as Assignment[] ?? []).map(a => a.id)

  // Student's submissions
  const { data: submissions } = assignmentIds.length
    ? await supabase
        .from('submissions')
        .select('assignment_id, score, graded_at')
        .in('assignment_id', assignmentIds)
        .eq('student_id', user.id)
    : { data: [] }

  const submissionMap = new Map(
    (submissions as Pick<Submission, 'assignment_id' | 'score' | 'graded_at'>[] ?? []).map(s => [s.assignment_id, s]),
  )

  const calendarAssignments: CalendarAssignment[] = (assignments as Assignment[] ?? []).map(a => {
    const sub = submissionMap.get(a.id)
    return {
      id: a.id,
      title: a.title,
      courseId: a.course_id,
      courseTitle: courseMap.get(a.course_id) ?? 'Curso',
      dueDate: a.due_date!,
      submitted: !!sub,
      graded: !!sub?.graded_at,
      score: sub?.score ?? null,
      maxScore: a.max_score,
    }
  })

  const [{ data: meetings }, { data: calEvents }] = await Promise.all([
    supabase.from('meetings').select('id, display_name, scheduled_at')
      .eq('institute_id', profile?.institute_id).not('scheduled_at', 'is', null).order('scheduled_at'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('calendar_events').select('*')
      .eq('institute_id', profile?.institute_id).order('event_date'),
  ])

  const calendarMeetings: CalendarMeeting[] = (meetings ?? []).map(m => ({
    id: m.id,
    displayName: m.display_name,
    scheduledAt: m.scheduled_at,
  }))

  const calendarEvents: CalendarEvent[] = (calEvents ?? []).map((e: {
    id: string; title: string; description: string | null
    event_date: string; event_time: string | null; color: string
  }) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    eventDate: e.event_date,
    eventTime: e.event_time,
    color: e.color,
  }))

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-[#050F1F] mb-1">Calendario</h1>
      <p className="text-[#050F1F]/50 mb-8">Tus entregas, fechas límite y reuniones.</p>
      <CalendarView assignments={calendarAssignments} role="student" meetings={calendarMeetings} events={calendarEvents} />
    </div>
  )
}
