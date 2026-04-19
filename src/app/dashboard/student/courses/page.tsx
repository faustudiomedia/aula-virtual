import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EnrollButton from '@/components/ui/EnrollButton'
import type { Course } from '@/lib/types'

export default async function StudentCoursesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, institute_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'alumno') redirect('/dashboard')

  // Todos los cursos publicados del instituto del alumno
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('institute_id', profile.institute_id)
    .eq('published', true)
    .order('created_at', { ascending: false })

  // Inscripciones actuales del alumno
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('student_id', user.id)

  const enrolledCourseIds = new Set(
    (enrollments ?? []).map((e: { course_id: string }) => e.course_id)
  )
  const courseList = (courses ?? []) as Course[]

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#050F1F]">Catálogo de cursos</h1>
        <p className="text-[#050F1F]/50 mt-1">Explorá y anotate en los cursos disponibles.</p>
      </div>

      {courseList.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#BAE6FD] p-12 text-center">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-[#050F1F]/50">No hay cursos publicados todavía.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courseList.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course.id)
            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-black/5 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1A56DB] to-[#38BDF8] flex items-center justify-center text-white font-bold flex-shrink-0 text-lg">
                    {course.title.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#050F1F]">{course.title}</h3>
                      {isEnrolled && (
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                          Inscripto
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#050F1F]/50 mt-1 line-clamp-2">
                      {course.description ?? 'Sin descripción'}
                    </p>
                  </div>
                </div>
                <EnrollButton
                  courseId={course.id}
                  courseTitle={course.title}
                  isEnrolled={isEnrolled}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}