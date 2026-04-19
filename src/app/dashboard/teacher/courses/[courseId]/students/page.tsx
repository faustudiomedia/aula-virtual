import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ProgressBar from '@/components/ui/ProgressBar'

interface Props {
  params: Promise<{ courseId: string }>
}

export default async function CourseStudentsPage({ params }: Props) {
  const { courseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'profesor') redirect('/dashboard')

  // Verificar que el curso pertenece al profesor
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, published')
    .eq('id', courseId)
    .eq('teacher_id', user.id)
    .single()

  if (!course) notFound()

  // Alumnos inscriptos en este curso con su progreso
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('id, progress, completed, enrolled_at, profiles(id, full_name, email, avatar_url)')
    .eq('course_id', courseId)
    .order('enrolled_at', { ascending: false })

  type EnrollmentWithProfile = {
    id: string
    progress: number
    completed: boolean
    enrolled_at: string
    profiles: {
      id: string
      full_name: string
      email: string
      avatar_url: string | null
    } | null
  }

  const enrollmentList = (enrollments as unknown as EnrollmentWithProfile[]) ?? []
  const completedCount = enrollmentList.filter((e) => e.completed).length
  const avgProgress = enrollmentList.length
    ? Math.round(enrollmentList.reduce((s, e) => s + e.progress, 0) / enrollmentList.length)
    : 0

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#050F1F]/50 mb-6">
        <Link href="/dashboard/teacher" className="hover:text-[#1A56DB] transition-colors">Mis cursos</Link>
        <span>/</span>
        <Link href={`/dashboard/teacher/courses/${courseId}/materials`} className="hover:text-[#1A56DB] transition-colors truncate max-w-xs">
          {course.title}
        </Link>
        <span>/</span>
        <span className="text-[#050F1F] font-medium">Alumnos</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#050F1F]">Alumnos inscriptos</h1>
          <p className="text-[#050F1F]/50 mt-1">
            {enrollmentList.length} alumno{enrollmentList.length !== 1 ? 's' : ''} en <em>{course.title}</em>
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Inscriptos', value: enrollmentList.length, color: '#1A56DB', bg: '#EFF6FF' },
          { label: 'Completados', value: completedCount, color: '#059669', bg: '#ECFDF5' },
          { label: 'Progreso promedio', value: `${avgProgress}%`, color: '#D97706', bg: '#FFFBEB' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl p-5 border border-black/5" style={{ background: stat.bg }}>
            <p className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-sm text-[#050F1F]/60 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Students table */}
      {enrollmentList.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#BAE6FD] p-12 text-center">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-[#050F1F]/50">Aún no hay alumnos inscriptos en este curso.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F0F9FF] border-b border-black/5">
              <tr>
                <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">Alumno</th>
                <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">Inscripto</th>
                <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium w-48">Progreso</th>
                <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {enrollmentList.map((enrollment) => {
                const student = enrollment.profiles
                const initials = (student?.full_name || student?.email || '?').charAt(0).toUpperCase()
                return (
                  <tr key={enrollment.id} className="hover:bg-[#F0F9FF]/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1A56DB] to-[#38BDF8] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="font-medium text-[#050F1F]">{student?.full_name || 'Sin nombre'}</p>
                          <p className="text-xs text-[#050F1F]/40">{student?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#050F1F]/50 text-xs">
                      {new Date(enrollment.enrolled_at).toLocaleDateString('es-AR', { dateStyle: 'medium' })}
                    </td>
                    <td className="px-5 py-3.5 w-48">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <ProgressBar value={enrollment.progress} />
                        </div>
                        <span className="text-xs font-medium text-[#050F1F]/60 flex-shrink-0 w-8 text-right">
                          {enrollment.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        enrollment.completed
                          ? 'bg-green-100 text-green-700'
                          : enrollment.progress > 0
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {enrollment.completed ? 'Completado' : enrollment.progress > 0 ? 'En progreso' : 'Sin iniciar'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
