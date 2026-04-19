import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { CalendarEvent } from '@/lib/types'
import CalendarView from '@/components/ui/CalendarView'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, institute_id').eq('id', user.id).single()
  if (!profile) redirect('/login')

  let events: CalendarEvent[] = []
  let teacherCourses: { id: string; title: string }[] = []

  if (profile.role === 'alumno') {
    // Alumno: ver eventos de cursos inscriptos
    const { data: enrollments } = await supabase
      .from('enrollments').select('course_id').eq('student_id', user.id)
    const courseIds = (enrollments ?? []).map(e => e.course_id)

    if (courseIds.length > 0) {
      const { data } = await supabase
        .from('events')
        .select('*, courses(title)')
        .in('course_id', courseIds)
        .gte('start_at', new Date(Date.now() - 7 * 86400000).toISOString()) // últimos 7 días y futuro
        .order('start_at')
      events = (data ?? []) as unknown as CalendarEvent[]
    }
  } else if (profile.role === 'profesor') {
    // Profesor: ver sus eventos + crear
    const { data: courses } = await supabase
      .from('courses').select('id, title').eq('teacher_id', user.id)
    teacherCourses = (courses ?? []) as { id: string; title: string }[]
    const courseIds = teacherCourses.map(c => c.id)

    if (courseIds.length > 0) {
      const { data } = await supabase
        .from('events')
        .select('*, courses(title)')
        .in('course_id', courseIds)
        .order('start_at')
      events = (data ?? []) as unknown as CalendarEvent[]
    }
  } else {
    // Admin: ver todos los eventos del instituto
    const { data } = await supabase
      .from('events')
      .select('*, courses(title)')
      .order('start_at')
      .limit(100)
    events = (data ?? []) as unknown as CalendarEvent[]
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#050F1F]">📅 Calendario</h1>
        <p className="text-[#050F1F]/50 mt-1">Eventos, clases y fechas de entrega.</p>
      </div>
      <CalendarView
        events={events}
        isTeacher={profile.role === 'profesor'}
        teacherCourses={teacherCourses}
      />
    </div>
  )
}
