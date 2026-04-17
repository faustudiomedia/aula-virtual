import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CalendarView } from '@/components/ui/CalendarView'
import type { CalendarAssignment } from '@/components/ui/CalendarView'
import type { Assignment } from '@/lib/types'

export default async function TeacherCalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'profesor' && profile?.role !== 'super_admin') redirect('/dashboard')

  // All courses taught by this teacher
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title')
    .eq('teacher_id', user.id)

  const courseIds = (courses ?? []).map((c: { id: string }) => c.id)
  const courseMap = new Map(
    (courses ?? []).map((c: { id: string; title: string }) => [c.id, c.title]),
  )

  // All assignments with due dates for those courses
  const { data: assignments } = courseIds.length
    ? await supabase
        .from('assignments')
        .select('*')
        .in('course_id', courseIds)
        .not('due_date', 'is', null)
        .order('due_date')
    : { data: [] }

  const calendarAssignments: CalendarAssignment[] = (assignments as Assignment[] ?? []).map(a => ({
    id: a.id,
    title: a.title,
    courseId: a.course_id,
    courseTitle: courseMap.get(a.course_id) ?? 'Curso',
    dueDate: a.due_date!,
  }))

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-[#050F1F] mb-1">Calendario</h1>
      <p className="text-[#050F1F]/50 mb-8">Fechas de entrega de tus cursos.</p>
      <CalendarView assignments={calendarAssignments} role="teacher" />
    </div>
  )
}
