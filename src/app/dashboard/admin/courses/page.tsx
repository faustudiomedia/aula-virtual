import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminCoursesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard/admin')

  const { data: courses } = await supabase
    .from('courses')
    .select('*, profiles(full_name, email), institutes(name)')
    .order('created_at', { ascending: false })

  const courseList = courses ?? []

  const { data: enrollmentCounts } = await supabase
    .from('enrollments')
    .select('course_id')

  const countMap: Record<string, number> = {}
  ;(enrollmentCounts ?? []).forEach((e: any) => {
    countMap[e.course_id] = (countMap[e.course_id] ?? 0) + 1
  })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-[#050F1F] mb-2">Todos los cursos</h1>
      <p className="text-[#050F1F]/50 mb-8">{courseList.length} cursos en la plataforma.</p>

      {courseList.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#BAE6FD] p-10 text-center">
          <p className="text-[#050F1F]/50">No hay cursos creados todavía.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F0F9FF] border-b border-black/5">
              <tr>
                <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">Curso</th>
                <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">Instituto</th>
                <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">Profesor</th>
                <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">Alumnos</th>
                <th className="text-left px-5 py-3 text-[#050F1F]/50 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {courseList.map((c: any) => (
                <tr key={c.id} className="hover:bg-[#F0F9FF]/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1A56DB] to-[#38BDF8] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {c.title.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-[#050F1F]">{c.title}</p>
                        <p className="text-xs text-[#050F1F]/40 truncate max-w-[200px]">{c.description ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[#050F1F]/60">{c.institutes?.name ?? '—'}</td>
                  <td className="px-5 py-3.5 text-[#050F1F]/60">{c.profiles?.full_name || c.profiles?.email || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-[#1A56DB]">{countMap[c.id] ?? 0}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      c.published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {c.published ? 'Publicado' : 'Borrador'}
                    </span>
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
