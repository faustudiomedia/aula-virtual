import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { deleteUserAction } from '@/app/actions/super-admin'
import DeleteUserButton from '@/components/ui/DeleteUserButton'
import Link from 'next/link'
import { Users, Plus } from 'lucide-react'

interface Props {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>
}

const PAGE_SIZE = 25

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  alumno:      { label: 'Alumno',      color: 'bg-sky-100/60 text-sky-700' },
  profesor:    { label: 'Profesor',    color: 'bg-blue-100/60 text-blue-700' },
  admin:       { label: 'Admin',       color: 'bg-violet-100/60 text-violet-700' },
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
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ag-text)]">Usuarios</h1>
          <p className="text-[var(--ag-text-muted)] mt-1 text-sm">{count ?? 0} usuarios en la plataforma</p>
        </div>
        <Link
          href="/dashboard/super-admin/users/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition shrink-0"
          style={{ background: 'var(--ag-navy)' }}
        >
          <Plus size={15} /> Nuevo usuario
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] shadow-sm p-4">
        <form className="flex gap-3 flex-wrap">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre o email..."
            className="flex-1 min-w-48 px-4 py-2 rounded-xl border border-[var(--ag-border)] text-sm text-[var(--ag-text)] bg-[var(--ag-surface-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 transition"
          />
          <select
            name="role"
            defaultValue={role}
            className="px-4 py-2 rounded-xl border border-[var(--ag-border)] text-sm text-[var(--ag-text)] bg-[var(--ag-surface-alt)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 transition"
          >
            <option value="all">Todos los roles</option>
            <option value="alumno">Alumnos</option>
            <option value="profesor">Profesores</option>
            <option value="admin">Admins</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <button type="submit"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition"
            style={{ background: 'var(--ag-navy)' }}>
            Buscar
          </button>
          {(q || role !== 'all') && (
            <Link href="/dashboard/super-admin/users"
              className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--ag-text-muted)] border border-[var(--ag-border)] hover:bg-[var(--ag-surface-alt)] transition">
              Limpiar
            </Link>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] shadow-sm overflow-hidden">
        {(users ?? []).length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[var(--ag-surface-alt)] flex items-center justify-center mx-auto mb-3">
              <Users size={22} className="text-[var(--ag-text-muted)]" />
            </div>
            <p className="text-[var(--ag-text-muted)] text-sm">No se encontraron usuarios</p>
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
                  const roleInfo = ROLE_LABELS[u.role] ?? { label: u.role, color: 'bg-[var(--ag-surface-alt)] text-[var(--ag-text-muted)]' }
                  const instituteName = (u.institutes as any)?.name ?? '—'
                  const date = new Date(u.created_at).toLocaleDateString('es-AR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                  })
                  return (
                    <tr key={u.id} className="border-b border-[var(--ag-border-light)] last:border-0 hover:bg-[var(--ag-surface-alt)] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                            style={{ background: 'var(--ag-navy)' }}
                          >
                            {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-[var(--ag-text)] truncate">{u.full_name || '(sin nombre)'}</p>
                            <p className="text-xs text-[var(--ag-text-muted)] truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[var(--ag-text-muted)] text-sm">{instituteName}</td>
                      <td className="px-4 py-4 text-[var(--ag-text-muted)] text-xs tabular-nums">{date}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          <Link
                            href={`/dashboard/super-admin/users/${u.id}/edit`}
                            className="px-3 py-1 rounded-lg text-xs font-medium border hover:bg-[var(--ag-surface-alt)] transition"
                            style={{ color: 'var(--ag-navy)', borderColor: 'rgba(30,58,95,0.2)' }}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`?q=${q}&role=${role}&page=${p}`}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                p === currentPage
                  ? 'text-white'
                  : 'text-[var(--ag-text-muted)] hover:bg-[var(--ag-surface-alt)]'
              }`}
              style={p === currentPage ? { background: 'var(--ag-navy)' } : {}}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
