import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Building2, Users, BookOpen, ClipboardList, CheckCircle, BarChart3 } from 'lucide-react'

export default async function SuperAdminStatsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/dashboard')

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

  const { data: profileStats } = await supabase
    .from('profiles')
    .select('institute_id, role, institutes(name)')

  const institutionMap: Record<string, { name: string; students: number; teachers: number; admins: number }> = {}
  ;(profileStats ?? []).forEach((p) => {
    if (!p.institute_id) return
    const inst = p.institutes as unknown as { name: string } | null
    const name = inst?.name ?? p.institute_id
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

  const kpis = [
    { label: 'Institutos activos', value: totalInstitutes ?? 0,     sub: 'en la plataforma',        Icon: Building2,   color: 'var(--ag-navy)', bg: 'rgba(30,58,95,0.08)',    border: 'rgba(30,58,95,0.14)' },
    { label: 'Usuarios totales',   value: totalUsers ?? 0,           sub: 'registrados',             Icon: Users,       color: '#0EA5E9',         bg: 'rgba(14,165,233,0.08)',  border: 'rgba(14,165,233,0.14)' },
    { label: 'Cursos creados',     value: totalCourses ?? 0,         sub: `${publishedRate}% publicados`, Icon: BookOpen, color: '#6366F1',      bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.14)' },
    { label: 'Inscripciones',      value: totalEnrollments ?? 0,     sub: 'totales',                 Icon: ClipboardList, color: '#10B981',      bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.14)' },
    { label: 'Completados',        value: completedEnrollments ?? 0, sub: `${completionRate}% de tasa`, Icon: CheckCircle, color: '#F59E0B',     bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.14)' },
    { label: 'Publicados',         value: publishedCourses ?? 0,     sub: 'cursos activos',          Icon: BarChart3,   color: '#EC4899',         bg: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.14)' },
  ]

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">

      <div>
        <h1 className="text-2xl font-bold text-[var(--ag-text)]">Estadísticas globales</h1>
        <p className="text-[var(--ag-text-muted)] mt-1 text-sm">Métricas generales de toda la plataforma Agorify</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl p-5 border"
            style={{ background: kpi.bg, borderColor: kpi.border }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(4px)' }}
            >
              <kpi.Icon size={20} style={{ color: kpi.color }} />
            </div>
            <p className="text-3xl font-bold text-[var(--ag-text)] mb-1 tabular-nums">
              {kpi.value.toLocaleString()}
            </p>
            <p className="text-sm font-semibold" style={{ color: kpi.color }}>{kpi.label}</p>
            <p className="text-xs text-[var(--ag-text-muted)] mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Ratio bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] shadow-sm p-6">
          <h2 className="text-base font-semibold text-[var(--ag-text)] mb-4">Tasa de completitud</h2>
          <div className="flex items-end gap-4">
            <span className="text-5xl font-bold text-[var(--ag-text)] tabular-nums">{completionRate}%</span>
            <span className="text-sm text-[var(--ag-text-muted)] mb-2">de inscripciones completadas</span>
          </div>
          <div className="mt-4 h-3 bg-[var(--ag-surface-alt)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%`, background: 'var(--ag-navy)' }}
            />
          </div>
        </div>

        <div className="bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] shadow-sm p-6">
          <h2 className="text-base font-semibold text-[var(--ag-text)] mb-4">Cursos publicados</h2>
          <div className="flex items-end gap-4">
            <span className="text-5xl font-bold text-[var(--ag-text)] tabular-nums">{publishedRate}%</span>
            <span className="text-sm text-[var(--ag-text-muted)] mb-2">del total de cursos</span>
          </div>
          <div className="mt-4 h-3 bg-[var(--ag-surface-alt)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${publishedRate}%`, background: 'linear-gradient(to right, #6366F1, #A78BFA)' }}
            />
          </div>
        </div>
      </div>

      {/* Top institutes */}
      {topInstitutes.length > 0 && (
        <div className="bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] shadow-sm p-6">
          <h2 className="text-base font-semibold text-[var(--ag-text)] mb-5">Institutos por alumnos</h2>
          <div className="space-y-4">
            {topInstitutes.map((inst, i) => {
              const maxStudents = topInstitutes[0]?.students || 1
              const pct = Math.round((inst.students / maxStudents) * 100)
              return (
                <div key={inst.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-[var(--ag-text)] flex items-center gap-2">
                      <span className="text-xs text-[var(--ag-text-muted)] w-4 tabular-nums">#{i + 1}</span>
                      {inst.name}
                    </span>
                    <span className="text-xs text-[var(--ag-text-muted)]">
                      {inst.students} alumnos · {inst.teachers} prof · {inst.admins} admin
                    </span>
                  </div>
                  <div className="h-2 bg-[var(--ag-surface-alt)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: 'var(--ag-navy)' }}
                    />
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
