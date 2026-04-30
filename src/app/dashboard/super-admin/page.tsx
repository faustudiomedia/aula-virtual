import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Building2, Users, BookOpen, ClipboardList, GraduationCap, UserCog, ShieldCheck } from 'lucide-react'

export default async function SuperAdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/dashboard')

  // ── Estadísticas globales ──────────────────────────────────────────────────
  const [
    { count: totalInstitutes },
    { count: totalUsers },
    { count: totalCourses },
    { count: totalEnrollments },
  ] = await Promise.all([
    supabase.from('institutes').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*',   { count: 'exact', head: true }),
    supabase.from('courses').select('*',    { count: 'exact', head: true }),
    supabase.from('enrollments').select('*',{ count: 'exact', head: true }),
  ])

  // ── Últimos institutos creados ─────────────────────────────────────────────
  const { data: recentInstitutes } = await supabase
    .from('institutes')
    .select('id, name, slug, active, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  // ── Desglose de usuarios por rol ──────────────────────────────────────────
  const { data: roleBreakdown } = await supabase
    .from('profiles')
    .select('role')

  const roleCounts = (roleBreakdown ?? []).reduce<Record<string, number>>((acc, p) => {
    acc[p.role] = (acc[p.role] ?? 0) + 1
    return acc
  }, {})

  const stats = [
    { label: 'Institutos',    value: totalInstitutes ?? 0,    Icon: Building2,      href: '/dashboard/super-admin/institutes', color: '#1A56DB' },
    { label: 'Usuarios',      value: totalUsers ?? 0,          Icon: Users,          href: '/dashboard/super-admin/users',      color: '#0EA5E9' },
    { label: 'Cursos',        value: totalCourses ?? 0,        Icon: BookOpen,       href: '#',                                 color: '#6366F1' },
    { label: 'Inscripciones', value: totalEnrollments ?? 0,    Icon: ClipboardList,  href: '#',                                 color: '#10B981' },
  ]

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">

      {/* ── Encabezado ── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#050F1F]">Panel Global</h1>
        <p className="text-[#050F1F]/50 mt-1">
          Bienvenido, {profile?.full_name ?? 'Super Admin'} — Vista completa de la plataforma Agorify
        </p>
      </div>

      {/* ── Cards de stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 hover:shadow-md transition-shadow group"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: s.color + '18' }}
            >
              <s.Icon size={20} style={{ color: s.color }} />
            </div>
            <p className="text-3xl font-bold text-[#050F1F]">{s.value.toLocaleString()}</p>
            <p className="text-sm text-[#050F1F]/50 mt-1">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Últimos institutos ── */}
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-[#050F1F]">Institutos recientes</h2>
            <Link
              href="/dashboard/super-admin/institutes"
              className="text-xs text-[#1A56DB] hover:underline font-medium"
            >
              Ver todos →
            </Link>
          </div>
          <div className="space-y-3">
            {(recentInstitutes ?? []).length === 0 && (
              <p className="text-sm text-[#050F1F]/40 text-center py-4">No hay institutos todavía</p>
            )}
            {(recentInstitutes ?? []).map((inst) => (
              <div key={inst.id} className="flex items-center justify-between py-2 border-b border-black/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1A56DB]/10 flex items-center justify-center text-sm font-bold text-[#1A56DB]">
                    {inst.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#050F1F]">{inst.name}</p>
                    <p className="text-xs text-[#050F1F]/40">{inst.slug}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  inst.active
                    ? 'bg-green-50 text-green-600'
                    : 'bg-red-50 text-red-500'
                }`}>
                  {inst.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            ))}
          </div>
          <Link
            href="/dashboard/super-admin/institutes/new"
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-[#1A56DB]/20 text-sm font-medium text-[#1A56DB] hover:border-[#1A56DB]/50 hover:bg-[#1A56DB]/5 transition-all"
          >
            <span>＋</span> Nuevo instituto
          </Link>
        </div>

        {/* ── Distribución de usuarios ── */}
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-[#050F1F]">Usuarios por rol</h2>
            <Link
              href="/dashboard/super-admin/users"
              className="text-xs text-[#1A56DB] hover:underline font-medium"
            >
              Ver todos →
            </Link>
          </div>
          <div className="space-y-4">
            {[
              { role: 'alumno',      label: 'Alumnos',    Icon: GraduationCap, color: '#10B981' },
              { role: 'profesor',    label: 'Profesores', Icon: UserCog,       color: '#1A56DB' },
              { role: 'admin',       label: 'Admins',     Icon: ShieldCheck,   color: '#6366F1' },
              { role: 'super_admin', label: 'Super Admin',Icon: ShieldCheck,   color: '#F59E0B' },
            ].map(({ role, label, Icon, color }) => {
              const count = roleCounts[role] ?? 0
              const total = totalUsers ?? 1
              const pct   = total > 0 ? Math.round((count / total) * 100) : 0

              return (
                <div key={role}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-[#050F1F] flex items-center gap-1.5">
                      <Icon size={14} style={{ color }} /> {label}
                    </span>
                    <span className="text-sm font-semibold text-[#050F1F]">{count}</span>
                  </div>
                  <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
