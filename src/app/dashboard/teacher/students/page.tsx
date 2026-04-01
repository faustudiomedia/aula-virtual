import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProgressBar from '@/components/ui/ProgressBar'

export default async function AllStudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, institute_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'profesor') redirect('/dashboard')

  // Students from same institute
  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name, email, created_at')
    .eq('institute_id', profile.institute_id)
    .eq('role', 'alumno')
    .order('full_name')

  // Get enrollment stats for each student
  const studentIds = (students ?? []).map((s) => s.id)
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('student_id, progress, completed')
    .in('student_id', studentIds)

  const statsMap: Record<string, { total: number; avgProgress: number; completed: number }> = {}
  ;(enrollments ?? []).forEach((e) => {
    const s = statsMap[e.student_id] ?? { total: 0, avgProgress: 0, completed: 0 }
    s.total++
    s.avgProgress += e.progress
    if (e.completed) s.completed++
    statsMap[e.student_id] = s
  })

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-[#050F1F] mb-2">Alumnos del instituto</h1>
      <p className="text-[#050F1F]/50 mb-8">
        {students?.length ?? 0} alumno{(students?.length ?? 0) !== 1 ? 's' : ''} registrado{(students?.length ?? 0) !== 1 ? 's' : ''}
      </p>

      {(students ?? []).length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#BAE6FD] p-10 text-center">
          <p className="text-[#050F1F]/50">No hay alumnos registrados en este instituto.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F0F9FF] border-b border-black/5">
              <tr>
                <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">Alumno</th>
                <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">Cursos</th>
                <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">Progreso promedio</th>
                <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">Completados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {(students ?? []).map((student) => {
                const stats = statsMap[student.id]
                const avg = stats ? Math.round(stats.avgProgress / stats.total) : 0
                return (
                  <tr key={student.id} className="hover:bg-[#F0F9FF]/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1A56DB] to-[#38BDF8] flex items-center justify-center text-white text-xs font-bold">
                          {(student.full_name || student.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-[#050F1F]">{student.full_name || 'Sin nombre'}</p>
                          <p className="text-xs text-[#050F1F]/40">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#050F1F]">{stats?.total ?? 0}</td>
                    <td className="px-5 py-3.5 w-40">
                      {stats ? <ProgressBar value={avg} /> : <span className="text-[#050F1F]/30 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-[#050F1F]">{stats?.completed ?? 0}</td>
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
