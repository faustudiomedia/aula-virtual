import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Material, Enrollment, Course, Announcement } from '@/lib/types'
import MaterialProgress from '@/components/ui/MaterialProgress'
import { UnenrollButton } from '@/components/ui/EnrollButton'
import AnnouncementSection from '@/components/ui/AnnouncementSection'

interface Props {
  params: Promise<{ courseId: string }>
}

export default async function StudentCourseDetailPage({ params }: Props) {
  const { courseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, institute_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'alumno') redirect('/dashboard')

  // Verificar que el alumno está inscripto y el curso es del instituto
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*, courses(*)')
    .eq('student_id', user.id)
    .eq('course_id', courseId)
    .single()

  if (!enrollment) notFound()

  const course = enrollment.courses as Course

  // Materiales del curso ordenados
  const { data: materials } = await supabase
    .from('materials')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index')

  const materialList = (materials ?? []) as Material[]
  const enrollmentData = enrollment as Enrollment

  // Quizzes publicados del curso
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id, title, is_published')
    .eq('course_id', courseId)
    .eq('is_published', true)

  const { data: announcements } = await supabase
    .from('announcements')
    .select('*, author:profiles!announcements_author_id_fkey(full_name, email, avatar_url)')
    .eq('course_id', courseId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
  const annList = (announcements ?? []) as unknown as Announcement[]

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#050F1F]/50 mb-6">
        <Link href="/dashboard/student/courses" className="hover:text-[#1A56DB] transition-colors">
          Catálogo
        </Link>
        <span>/</span>
        <span className="text-[#050F1F] font-medium truncate">{course.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1A56DB] to-[#38BDF8] flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {course.title.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#050F1F]">{course.title}</h1>
            {course.description && (
              <p className="text-[#050F1F]/50 mt-1">{course.description}</p>
            )}
          </div>
        </div>
        <UnenrollButton courseId={courseId} courseTitle={course.title} />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4 mb-8">
         <Link href={`/dashboard/student/courses/${courseId}/forum`} className="bg-white rounded-xl border border-black/5 p-4 flex items-center gap-4 hover:border-[#1A56DB] hover:shadow-sm transition group">
            <span className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-xl text-[#1A56DB]">💬</span>
            <div>
               <h3 className="font-semibold text-[#050F1F] group-hover:text-[#1A56DB] transition">Foro de Discusión</h3>
               <p className="text-xs text-[#050F1F]/50 mt-0.5">Consultas y debates</p>
            </div>
         </Link>
         <Link href={`/dashboard/student/courses/${courseId}/assignments`} className="bg-white rounded-xl border border-black/5 p-4 flex items-center gap-4 hover:border-[#D97706] hover:shadow-sm transition group">
            <span className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-xl text-[#D97706]">📦</span>
            <div>
               <h3 className="font-semibold text-[#050F1F] group-hover:text-[#D97706] transition">Trabajos Prácticos</h3>
               <p className="text-xs text-[#050F1F]/50 mt-0.5">Entregas y calificaciones</p>
            </div>
         </Link>
      </div>

      {/* Announcements */}
      <AnnouncementSection announcements={annList} courseId={courseId} isTeacher={false} />

      {/* Quizzes section */}
      {(quizzes ?? []).length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-semibold text-[#050F1F] mb-3">🧠 Evaluaciones</h2>
          <div className="grid gap-3">
            {(quizzes ?? []).map((quiz: { id: string; title: string; is_published: boolean }) => (
              <Link
                key={quiz.id}
                href={`/dashboard/student/courses/${courseId}/quiz/${quiz.id}`}
                className="bg-white rounded-xl border border-black/5 px-5 py-4 flex items-center justify-between hover:border-[#BAE6FD] hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📝</span>
                  <span className="font-medium text-[#050F1F] group-hover:text-[#1A56DB] transition-colors">
                    {quiz.title}
                  </span>
                </div>
                <span className="text-[#1A56DB] text-sm font-medium">Resolver →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Materials section */}
      <div>
        <h2 className="text-base font-semibold text-[#050F1F] mb-3">
          📚 Materiales del curso
        </h2>

        {materialList.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#BAE6FD] p-10 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-[#050F1F]/50">Este curso aún no tiene materiales.</p>
          </div>
        ) : (
          <MaterialProgress
            materials={materialList}
            enrollmentId={enrollmentData.id}
          />
        )}
      </div>
    </div>
  )
}
