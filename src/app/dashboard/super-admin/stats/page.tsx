import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function SuperAdminStatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/dashboard')

  // ── Datos globales ─────────────────────────────────────────────────────────
  const [
    { count: totalInstitutes },
    { count: totalUsers },
    { count: totalCourses },
    { count: publishedCourses },
    { count: totalEnrollments },
    { count: completedEnrollments },
  ] = await Promise.all([
    supabase.from('institutes').select('*',    { count: 'exact', head: true }),
    supabase.from('profiles').select('*',      { count: 'exact', head: true }),
    supabase.from('courses').select('*',       { count: 'exact', head: true }),
    supabase.from('courses').select('*',       { count: 'exact', head: true }).eq('published', true),
    supabase.from('enrollments').select('*',   { count: 'exact', head: true }),
    supabase.from('enrollments').select('*',   { count: 'exact', head: true }).eq('completed', true),
  ])

  // Top institutos por alumnos
  const { data: profileStats } = await supabase
    .from('profiles')
    .select('institute_id, role, institutes(name)')

  const institutionMap: Record<string, { name: string; students: number; teachers: number; admins: number }> = {}
  ;(profileStats ?? []).forEach((p: any) => {
    if (!p.institute_id) return
    const name = p.institutes?.name ?? p.institute_id
    const entry = institutionMap[p.institute_id] ?? { name, students: 0, teachers: 0, admins: 0 }
    if (p.role === 'alumno')   entry.students++
    if (p.role === 'profesor') entry.teachers++
    if (p.role === 'admin')    entry.admins++
    institutionMap[p.institute_id] = entry
  })

  const topInstitutes = Object.values(institutionMap)
    .sort((a, b) => b.students - a.students)
    .slice(0, 8)

  const completionRate = totalEnrollments && totalEnrollments > 0
    ? Math.round(((completedEnrollments ?? 0) / totalEnrollments) * 100)
    : 0

  const publishedRate = totalCourses && totalCourses > 0
    ? Math.round(((publishedCourses ?? 0) / totalCourses) * 100)
    : 0

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#050F1F]">Estadísticas globales</h1>
        <p className="text-[#050F1F]/50 mt-1">Métricas generales de toda la plataforma MAVIC</p>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Institutos activos', value: totalInstitutes ?? 0,     icon: '🏫', sub: 'en la plataforma' },
          { label: 'Usuarios totales',   value: totalUsers ?? 0,           icon: '👥', sub: 'registrados' },
          { label: 'Cursos creados',     value: totalCourses ?? 0,         icon: '📚', sub: `${publishedRate}% publicados` },
          { label: 'Inscripciones',      value: totalEnrollments ?? 0,     icon: '📝', sub: 'totales' },
          { label: 'Cursos completados', value: completedEnrollments ?? 0, icon: '✅', sub: `${completionRate}% de tasa` },
          { label: 'Publicados',         value: publishedCourses ?? 0,     icon: '🟢', sub: 'cursos activos' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
            <div className="text-2xl mb-2">{kpi.icon}</div>
            <p className="text-3xl font-bold text-[#050F1F]">{kpi.value.toLocaleString()}</p>
            <p className="text-sm font-medium text-[#050F1F] mt-1">{kpi.label}</p>
            <p className="text-xs text-[#050F1F]/40 mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Ratios visuales ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#050F1F] mb-4">Tasa de completitud</h2>
          <div className="flex items-end gap-4">
            <span className="text-5xl font-bold text-[#050F1F]">{completionRate}%</span>
            <span className="text-sm text-[#050F1F]/50 mb-2">de inscripciones completadas</span>
          </div>
          <div className="mt-4 h-3 bg-black/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#1A56DB] to-[#38BDF8] rounded-full"
              style={{ width: `${completionRate}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#050F1F] mb-4">Cursos publicados</h2>
          <div className="flex items-end gap-4">
            <span className="text-5xl font-bold text-[#050F1F]">{publishedRate}%</span>
            <span className="text-sm text-[#050F1F]/50 mb-2">del total de cursos</span>
          </div>
          <div className="mt-4 h-3 bg-black/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#6366F1] to-[#A78BFA] rounded-full"
              style={{ width: `${publishedRate}%` }} />
          </div>
        </div>
      </div>

      {/* ── Top institutos ── */}
      {topInstitutes.length > 0 && (
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#050F1F] mb-5">Institutos por alumnos</h2>
          <div className="space-y-3">
            {topInstitutes.map((inst, i) => {
              const maxStudents = topInstitutes[0]?.students || 1
              const pct = Math.round((inst.students / maxStudents) * 100)
              return (
                <div key={inst.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-[#050F1F] flex items-center gap-2">
                      <span className="text-xs text-[#050F1F]/30 w-4">#{i + 1}</span>
                      {inst.name}
                    </span>
                    <span className="text-sm text-[#050F1F]/60">
                      {inst.students} alumnos · {inst.teachers} prof · {inst.admins} admin
                    </span>
                  </div>
                  <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1A56DB] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
