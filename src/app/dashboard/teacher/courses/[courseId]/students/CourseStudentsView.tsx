'use client'

import { useCourse, useCourseEnrollments } from '@/lib/hooks/use-data'
import ProgressBar from '@/components/ui/ProgressBar'

interface Props {
  courseId: string
}

export default function CourseStudentsView({ courseId }: Props) {
  const { data: course, isLoading: loadingCourse } = useCourse(courseId)
  const { data: enrollments = [], isLoading: loadingEnrollments } = useCourseEnrollments(courseId)

  const isLoading = loadingCourse || loadingEnrollments

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
          <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-40 mb-8" />
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm h-48" />
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <p className="text-[#050F1F]/50">Curso no encontrado.</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <a href="/dashboard/teacher" className="text-[#1A56DB] hover:underline text-sm">← Mis cursos</a>
      <h1 className="text-2xl font-bold text-[#050F1F] mt-2 mb-1">{course.title}</h1>
      <p className="text-[#050F1F]/50 mb-8">
        {enrollments.length} alumno{enrollments.length !== 1 ? 's' : ''} inscripto{enrollments.length !== 1 ? 's' : ''}
      </p>

      {enrollments.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#BAE6FD] p-10 text-center">
          <p className="text-[#050F1F]/50">Ningún alumno inscripto todavía.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F0F9FF] border-b border-black/5">
              <tr>
                <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">Alumno</th>
                <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">Progreso</th>
                <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">Estado</th>
                <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">Inscripción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {enrollments.map((e: any) => (
                <tr key={e.id} className="hover:bg-[#F0F9FF]/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1A56DB] to-[#38BDF8] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(e.profiles?.full_name || e.profiles?.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-[#050F1F]">{e.profiles?.full_name || 'Sin nombre'}</p>
                        <p className="text-xs text-[#050F1F]/40">{e.profiles?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 w-48">
                    <ProgressBar value={e.progress} />
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      e.completed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {e.completed ? 'Completado' : 'En curso'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[#050F1F]/50">
                    {new Date(e.enrolled_at).toLocaleDateString('es-AR', { dateStyle: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
