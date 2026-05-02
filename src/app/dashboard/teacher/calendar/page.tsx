import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { CalendarAssignment, CalendarMeeting, CalendarEvent } from '@/components/ui/CalendarView'
import type { Assignment } from '@/lib/types'
import { CreateEventForm } from './CreateEventForm'
import { CalendarClientWrapper } from './CalendarClientWrapper'

export default async function TeacherCalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, institute_id').eq('id', user.id).single()
  if (profile?.role !== 'profesor' && profile?.role !== 'super_admin') redirect('/dashboard')

  const { data: courses } = await supabase
    .from('courses').select('id, title').eq('teacher_id', user.id)

  const courseIds = (courses ?? []).map((c: { id: string }) => c.id)
  const courseMap = new Map((courses ?? []).map((c: { id: string; title: string }) => [c.id, c.title]))

  const [
    { data: assignments },
    { data: meetings },
    { data: calEvents },
  ] = await Promise.all([
    courseIds.length
      ? supabase.from('assignments').select('*').in('course_id', courseIds).not('due_date', 'is', null).order('due_date')
      : Promise.resolve({ data: [] }),
    supabase.from('meetings').select('id, display_name, scheduled_at')
      .eq('institute_id', profile?.institute_id).not('scheduled_at', 'is', null).order('scheduled_at'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('calendar_events').select('*')
      .eq('institute_id', profile?.institute_id).order('event_date'),
  ])

  const calendarAssignments: CalendarAssignment[] = (assignments as Assignment[] ?? []).map(a => ({
    id: a.id,
    title: a.title,
    courseId: a.course_id,
    courseTitle: courseMap.get(a.course_id) ?? 'Curso',
    dueDate: a.due_date!,
  }))

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
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ag-text)] mb-1">Calendario</h1>
          <p className="text-[var(--ag-text-muted)]">Fechas de entrega, reuniones y eventos del instituto.</p>
        </div>
        <CreateEventForm />
      </div>
      <CalendarClientWrapper
        assignments={calendarAssignments}
        meetings={calendarMeetings}
        events={calendarEvents}
      />
    </div>
  )
}
