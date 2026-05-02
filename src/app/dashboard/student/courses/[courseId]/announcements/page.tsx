import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StudentCourseNavTabs } from '@/components/ui/StudentCourseNavTabs'
import Link from 'next/link'
import type { Announcement } from '@/lib/types'

interface Props {
  params: Promise<{ courseId: string }>
}

export default async function StudentAnnouncementsPage({ params }: Props) {
  const { courseId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'alumno' && profile?.role !== 'super_admin') redirect('/dashboard')

  const { data: course } = await supabase
    .from('courses').select('title, published').eq('id', courseId).single()
  if (!course?.published) redirect('/dashboard/student')

  const { data: enrollment } = await supabase
    .from('enrollments').select('id').eq('course_id', courseId).eq('student_id', user.id).single()
  if (!enrollment) redirect('/dashboard/student')

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-2">
        <Link href="/dashboard/student" className="text-sm text-[var(--ag-text-muted)] hover:text-[var(--ag-text)] transition-colors">
          ← Mis cursos
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[var(--ag-text)] mb-6">{course.title}</h1>

      <StudentCourseNavTabs courseId={courseId} />

      <div className="space-y-4">
        {(announcements as Announcement[] ?? []).map((a) => (
          <div key={a.id} className="bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] shadow-sm p-5">
            <h3 className="font-semibold text-[var(--ag-text)] mb-1">{a.title}</h3>
            {a.content && (
              <p className="text-sm text-[var(--ag-text)]/70 whitespace-pre-wrap">{a.content}</p>
            )}
            <p className="text-xs text-[var(--ag-text)]/30 mt-3">
              {new Date(a.created_at).toLocaleDateString('es-AR', { dateStyle: 'long' })}
            </p>
          </div>
        ))}
        {(announcements ?? []).length === 0 && (
          <div className="text-center py-16 text-[var(--ag-text-muted)] text-sm">
            No hay anuncios todavía.
         
