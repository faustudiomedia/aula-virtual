import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>
}

const PAGE_SIZE = 25

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  alumno:      { label: 'Alumno',      color: 'bg-sky-50 text-sky-700' },
  profesor:    { label: 'Profesor',    color: 'bg-blue-50 text-blue-700' },
  admin:       { label: 'Admin',       color: 'bg-violet-50 text-violet-700' },
  super_admin: { label: 'Super Admin', color: 'bg-amber-50 text-amber-700' },
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

  // Query de usuarios con su instituto
  let query = supabase
    .from('profiles')
    .select('*, institutes(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (q.trim())    query = query.or(`full_name.ilike.%${q.trim()}%,email.ilike.%${q.trim()}%`)
  if (role !== 'all') query = query.eq('role', role)

  const { data: users, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#050F1F]">Usuarios</h1>
          <p className="text-[#050F1F]/50 mt-1">{count ?? 0} usuarios en la plataforma</p>
        </div>
        <Link
          href="/dashboard/super-admin/users/new"
          className="px-4 py-2 rounded-xl bg-[#1A56DB] text-white text-sm font-semibold hover:bg-[#1A56DB]/90 transition-all shadow-lg shadow-[#1A56DB]/20"
        >
          + Nuevo usuario
        </Link>
      </div>

      {/* ── Filtros ── */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm mb-6 p-4">
        <form className="flex gap-3 flex-wrap">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre o email..."
            className="flex-1 min-w-48 px-4 py-2 rounded-xl border border-black/10 text-sm text-[#050F1F] focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
          />
          <select
            name="role"
            defaultValue={role}
            className="px-4 py-2 rounded-xl border border-black/10 text-sm text-[#050F1F] focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
          >
            <option value="all">Todos los roles</option>
            <option value="alumno">Alumnos</option>
            <option value="profesor">Profesores</option>
            <option value="admin">Admins</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <button type="submit"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#1A56DB] hover:bg-[#1A56DB]/90 transition-all">
            Buscar
          </button>
          {(q || role !== 'all') && (
            <Link href="/dashboard/super-admin/users"
              className="px-4 py-2 rounded-xl text-sm font-medium text-[#050F1F]/60 border border-black/10 hover:bg-black/5 transition-all">
              Limpiar
            </Link>
          )}
        </form>
      </div>

      {/* ── Tabla ── */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        {(users ?? []).length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-[#050F1F]/50">No se encontraron usuarios</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 bg-black/[0.02]">
                <th className="text-left px-6 py-3.5 font-semibold text-[#050F1F]/60">Usuario</th>
                <th className="text-left px-4 py-3.5 font-semibold text-[#050F1F]/60">Rol</th>
                <th className="text-left px-4 py-3.5 font-semibold text-[#050F1F]/60">Instituto</th>
                <th className="text-left px-4 py-3.5 font-semibold text-[#050F1F]/60">Registrado</th>
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((u: any) => {
                const roleInfo = ROLE_LABELS[u.role] ?? { label: u.role, color: 'bg-gray-50 text-gray-600' }
                const instituteName = (u.institutes as any)?.name ?? '—'
                const date = new Date(u.created_at).toLocaleDateString('es-AR', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                })
                return (
                  <tr key={u.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.01]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1A56DB]/10 flex items-center justify-center text-sm font-bold text-[#1A56DB] flex-shrink-0">
                          {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-[#050F1F]">{u.full_name || '(sin nombre)'}</p>
                          <p className="text-xs text-[#050F1F]/40">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
                        {roleInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[#050F1F]/60 text-sm">{instituteName}</td>
                    <td className="px-4 py-4 text-[#050F1F]/40 text-xs">{date}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Paginación ── */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`?q=${q}&role=${role}&page=${p}`}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                p === currentPage ? 'text-white bg-[#050F1F]' : 'text-[#050F1F]/60 hover:bg-black/5'
              }`}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
