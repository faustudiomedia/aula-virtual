import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Building2, Users, BookOpen, ClipboardList,
  GraduationCap, UserCog, ShieldCheck, TrendingUp,
  ArrowRight, Plus,
} from 'lucide-react'

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

  // Global counts
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

  // Recent institutes
  const { data: recentInstitutes } = await supabase
    .from('institutes')
    .select('id, name, slug, active, created_at, primary_color, secondary_color')
    .order('created_at', { ascending: false })
    .limit(5)

  // Role breakdown
  const { data: roleBreakdown } = await supabase
    .from('profiles')
    .select('role')

  const roleCounts = (roleBreakdown ?? []).reduce<Record<string, number>>((acc, p) => {
    acc[p.role] = (acc[p.role] ?? 0) + 1
    return acc
  }, {})

  const stats = [
    {
      label: 'Institutos',
      value: totalInstitutes ?? 0,
      sub: 'activos en la plataforma',
      Icon: Building2,
      href: '/dashboard/super-admin/institutes',
      color: 'var(--ag-navy)',
      bg: 'rgba(30,58,95,0.08)',
      border: 'rgba(30,58,95,0.14)',
    },
    {
      label: 'Usuarios',
      value: totalUsers ?? 0,
      sub: 'registrados',
      Icon: Users,
      href: '/dashboard/super-admin/users',
      color: '#0EA5E9',
      bg: 'rgba(14,165,233,0.08)',
      border: 'rgba(14,165,233,0.14)',
    },
    {
      label: 'Cursos',
      value: totalCourses ?? 0,
      sub: 'creados',
      Icon: BookOpen,
      href: '/dashboard/super-admin/courses',
      color: '#6366F1',
      bg: 'rgba(99,102,241,0.08)',
      border: 'rgba(99,102,241,0.14)',
    },
    {
      label: 'Inscripciones',
      value: totalEnrollments ?? 0,
      sub: 'totales',
      Icon: ClipboardList,
      href: '/dashboard/super-admin/stats',
      color: '#10B981',
      bg: 'rgba(16,185,129,0.08)',
      border: 'rgba(16,185,129,0.14)',
    },
  ]

  const roles = [
    { role: 'alumno',      label: 'Alumnos',     Icon: GraduationCap, color: '#10B981' },
    { role: 'profesor',    label: 'Profesores',  Icon: UserCog,       color: 'var(--ag-navy)' },
    { role: 'admin',       label: 'Admins',      Icon: ShieldCheck,   color: '#6366F1' },
    { role: 'super_admin', label: 'Super Admin', Icon: ShieldCheck,   color: '#F59E0B' },
  ]

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ag-text)]">Panel Global</h1>
          <p className="text-[var(--ag-text-muted)] mt-1 text-sm">
            Bienvenido, <span className="font-medium text-[var(--ag-text)]">{profile?.full_name ?? 'Super Admin'}</span> — Vista completa de la plataforma Agorify
          </p>
        </div>
        <Link
          href="/dashboard/super-admin/institutes/new"
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition shrink-0"
          style={{ background: 'var(--ag-navy)' }}
        >
          <Plus size={15} /> Nuevo instituto
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-2xl p-5 border transition-all hover:-translate-y-0.5 hover:shadow-md"
            style={{ background: s.bg, borderColor: s.border }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(4px)' }}
            >
              <s.Icon size={20} style={{ color: s.color }} />
            </div>
            <p className="text-3xl font-bold text-[var(--ag-text)] mb-1 tabular-nums">
              {(s.value as number).toLocaleString()}
            </p>
            <p className="text-sm font-semibold" style={{ color: s.color }}>{s.label}</p>
            <p className="text-xs text-[var(--ag-text-muted)] mt-0.5">{s.sub}</p>
            <div className="flex items-center gap-1 mt-3 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: s.color }}>
              Ver detalle <ArrowRight size={11} />
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent institutes */}
        <div className="bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--ag-border-light)]">
            <div className="flex items-center gap-2">
              <Building2 size={16} style={{ color: 'var(--ag-navy)' }} />
              <h2 className="text-sm font-semibold text-[var(--ag-text)]">Institutos recientes</h2>
            </div>
            <Link
              href="/dashboard/super-admin/institutes"
              className="text-xs font-medium flex items-center gap-1 hover:underline"
              style={{ color: 'var(--ag-navy)' }}
            >
              Ver todos <ArrowRight size={11} />
            </Link>
          </div>

          <div className="divide-y divide-[var(--ag-border-light)]">
            {(recentInstitutes ?? []).length === 0 ? (
              <p className="text-sm text-[var(--ag-text-muted)] text-center py-8">No hay institutos todavía</p>
            ) : (recentInstitutes ?? []).map((inst) => (
              <Link
                key={inst.id}
                href={`/dashboard/super-admin/institutes/${inst.id}`}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-[var(--ag-surface-alt)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm shrink-0"
                    style={{
                      background: inst.primary_color
                        ? `linear-gradient(135deg, ${inst.primary_color}, ${inst.secondary_color ?? inst.primary_color})`
                        : 'var(--ag-navy)',
                    }}
                  >
                    {inst.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--ag-text)] truncate">{inst.name}</p>
                    <p className="text-xs text-[var(--ag-text-muted)]">/{inst.slug}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                  inst.active
                    ? 'bg-green-100/60 text-green-700'
                    : 'bg-red-100/60 text-red-600'
                }`}>
                  {inst.active ? 'Activo' : 'Inactivo'}
                </span>
              </Link>
            ))}
          </div>

          <div className="px-6 py-4 border-t border-[var(--ag-border-light)]">
            <Link
              href="/dashboard/super-admin/institutes/new"
              className="flex items-center justify-center gap-2 w-full py-2 rounded-xl border-2 border-dashed text-sm font-medium transition-all hover:bg-[rgba(30,58,95,0.04)]"
              style={{ borderColor: 'rgba(30,58,95,0.18)', color: 'var(--ag-navy)' }}
            >
              <Plus size={14} /> Nuevo instituto
            </Link>
          </div>
        </div>

        {/* Users by role */}
        <div className="bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--ag-border-light)]">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} style={{ color: 'var(--ag-navy)' }} />
              <h2 className="text-sm font-semibold text-[var(--ag-text)]">Usuarios por rol</h2>
            </div>
            <Link
              href="/dashboard/super-admin/users"
              className="text-xs font-medium flex items-center gap-1 hover:underline"
              style={{ color: 'var(--ag-navy)' }}
            >
              Ver todos <ArrowRight size={11} />
            </Link>
          </div>

          <div className="px-6 py-5 space-y-5">
            {roles.map(({ role, label, Icon, color }) => {
              const count = roleCounts[role] ?? 0
              const total = (totalUsers ?? 0) > 0 ? (totalUsers as number) : 1
              const pct = Math.round((count / total) * 100)

              return (
                <div key={role}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[var(--ag-text)] flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ background: `${color}18` }}
                      >
                        <Icon size={13} style={{ color }} />
                      </span>
                      {label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--ag-text-muted)]">{pct}%</span>
                      <span className="text-sm font-bold text-[var(--ag-text)] tabular-nums w-5 text-right">{count}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[var(--ag-surface-alt)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Summary footer */}
          <div className="px-6 py-4 border-t border-[var(--ag-border-light)] bg-[var(--ag-surface-alt)]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--ag-text-muted)]">Total usuarios</span>
              <span className="font-bold text-[var(--ag-text)] tabular-nums">{(totalUsers ?? 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
