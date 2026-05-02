import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { deleteUserAction } from '@/app/actions/super-admin'
import DeleteUserButton from '@/components/ui/DeleteUserButton'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>
}

const PAGE_SIZE = 25

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  alumno:      { label: 'Alumno',      color: 'bg-sky-50 text-sky-700' },
  profesor:    { label: 'Profesor',    color: 'bg-blue-100/60 text-blue-700' },
  admin:       { label: 'Admin',       color: 'bg-violet-50 text-violet-700' },
  super_admin: { label: 'Super Admin', color: 'bg-amber-100/60 text-amber-700' },
}

export default async function SuperAdminUsersPage({ searchParams }: Props) {
  const { q = '', role = 'all', page = '1' } = await searchParams
  const currentPage = Math.max(1, parseInt(page) || 1)
  const offset = (currentPage - 1) * PAGE_SIZE

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/dashboard')

  let query = supabase
    .from('profiles')
    .select('*, institutes(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (q.trim())       query = query.or(`full_name.ilike.%${q.trim()}%,email.ilike.%${q.trim()}%`)
  if (role !== 'all') query = query.eq('role', role)

  const { data: users, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ag-text)]">Usuarios</h1>
          <p className="text-[var(--ag-text-muted)] mt-1">{count ?? 0} usuarios en la plataforma</p>
        </div>
        <Link
          href="/dashboard/super-admin/users/new"
          className="px-4 py-2 rounded-xl bg-[var(--ag-navy)] text-white text-sm font-semibold hover:bg-[var(--ag-navy)]/90 transition-all shadow-lg "
        >
          + Nuevo usuario
        </Link>
      </div>

      {/* ── Filtros ── */}
      <div className="bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] shadow-sm mb-6 p-4">
        <form className="flex gap-3 flex-wrap">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre o email..."
            className="flex-1 min-w-48 px-4 py-2 rounded-xl border border-[var(--ag-border)] text-sm text-[var(--ag-text)] bg-[var(--ag-bg)] text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30"
          />
          <select
            name="role"
            defaultValue={role}
            className="px-4 py-2 rounded-xl border border-[var(--ag-border)] text-sm text-[var(--ag-text)] bg-[var(--ag-bg)] text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30"
          >
            <option value="all">Todos los roles</option>
            <option value="alumno">Alumnos</option>
            <option value="profesor">Profesores</option>
            <option value="admin">Admins</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <button type="submit"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[var(--ag-navy)] hover:bg-[var(--ag-navy)]/90 transition-all">
            Buscar
          </button>
          {(q || role !== 'all') && (
            <Link href="/dashboard/super-admin/users"
              className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--ag-text-muted)] border border-[var(--ag-border)] hover:bg-[var(--ag-surface-alt)] transition-all">
              Limpiar
            </Link>
          )}
        </form>
      </div>

      {/* ── Tabla ── */}
      <div className="bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] shadow-sm overflow-hidden">
        {(users ?? []).length === 0 ? (

          <div className="py-16 text-center">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-[var(--ag-text-muted)]">No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-sm">
            <thead>
              <tr className="border-b border-[var(--ag-border-light)] bg-[var(--ag-surface-alt)]">
                <th className="text-left px-6 py-3.5 font-semibold text-[var(--ag-text-muted)]">Usuario</th>
                <th className="text-left px-4 py-3.5 font-semibold text-[var(--ag-text-muted)]">Rol</th>
                <th className="text-left px-4 py-3.5 font-semibold text-[var(--ag-text-muted)]">Instituto</th>
                <th className="text-left px-4 py-3.5 font-semibold text-[var(--ag-text-muted)]">Registrado</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((u: any) => {
                const roleInfo = ROLE_LABELS[u.role] ?? { label: u.role, color: 'bg-gray-50 text-[var(--ag-text-muted)]' }
                const instituteName = (u.institutes as any)?.name ?? '—'
                const date = new Date(u.created_at).toLocaleDateString('es-AR', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                })
                return (
                  <tr key={u.id} className="border-b border-[var(--ag-border-light)] last:border-0 hover:bg-[var(--ag-surface-alt)]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--ag-navy)]/10 flex items-center justify-center text-sm font-bold text-[var(--ag-navy)] flex-shrink-0">
                          {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--ag-text)]">{u.full_name || '(sin nombre)'}</p>
                          <p className="text-xs text-[var(--ag-text-muted)]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
                        {roleInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[var(--ag-text-muted)] text-sm">{instituteName}</td>
                    <td className="px-4 py-4 text-[var(--ag-text-muted)] text-xs">{date}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/dashboard/super-admin/users/${u.id}/edit`}
                          className="px-3 py-1 rounded-lg text-xs font-medium text-[var(--ag-navy)] border border-[var(--ag-navy)]/20 hover:bg-[var(--ag-navy)]/5 transition-all"
                        >
                          Editar
                        </Link>
                        <DeleteUserButton userId={u.id} action={deleteUserAction} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* ── Paginación ── */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`?q=${q}&role=${role}&page=${p}`}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                p === currentPa
