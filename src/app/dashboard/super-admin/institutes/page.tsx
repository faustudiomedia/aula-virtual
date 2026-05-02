import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>
}

const PAGE_SIZE = 20

export default async function SuperAdminInstitutesPage({ searchParams }: Props) {
  const { q = '', page = '1', status = 'all' } = await searchParams
  const currentPage = Math.max(1, parseInt(page) || 1)
  const offset = (currentPage - 1) * PAGE_SIZE

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/dashboard')

  // Query
  let query = supabase
    .from('institutes')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (q.trim()) query = query.ilike('name', `%${q.trim()}%`)
  if (status === 'active')   query = query.eq('active', true)
  if (status === 'inactive') query = query.eq('active', false)

  const { data: institutes, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  // Contar usuarios y cursos por instituto
  const { data: profileStats } = await supabase.from('profiles').select('institute_id, role')
  const { data: courseStats }  = await supabase.from('courses').select('institute_id')

  const usersByInstitute: Record<string, number> = {}
  const coursesByInstitute: Record<string, number> = {}

  ;(profileStats ?? []).forEach((p: { institute_id: string | null; role: string }) => {
    if (p.institute_id) usersByInstitute[p.institute_id] = (usersByInstitute[p.institute_id] ?? 0) + 1
  })
  ;(courseStats ?? []).forEach((c: { institute_id: string | null }) => {
    if (c.institute_id) coursesByInstitute[c.institute_id] = (coursesByInstitute[c.institute_id] ?? 0) + 1
  })

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ag-text)]">Institutos</h1>
          <p className="text-[var(--ag-text-muted)] mt-1">{count ?? 0} institutos en la plataforma</p>
        </div>
        <Link
          href="/dashboard/super-admin/institutes/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: 'var(--ag-navy)' }}
        >
          <span>＋</span> Nuevo instituto
        </Link>
      </div>

      {/* ── Filtros ── */}
      <div className="bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] shadow-sm mb-6 p-4">
        <form className="flex gap-3 flex-wrap">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre..."
            className="flex-1 min-w-48 px-4 py-2 rounded-xl border border-[var(--ag-border)] text-sm text-[var(--ag-text)] bg-[var(--ag-bg)] text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30"
          />
          <select
            name="status"
            defaultValue={status}
            className="px-4 py-2 rounded-xl border border-[var(--ag-border)] text-sm text-[var(--ag-text)] bg-[var(--ag-bg)] text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30"
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[var(--ag-navy)] hover:bg-[var(--ag-navy)]/90 transition-all"
          >
            Buscar
          </button>
          {(q || status !== 'all') && (
            <Link
              href="/dashboard/super-admin/institutes"
              className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--ag-text-muted)] border border-[var(--ag-border)] hover:bg-[var(--ag-surface-alt)] transition-all"
            >
              Limpiar
            </Link>
          )}
        </form>
      </div>

      {/* ── Tabla ── */}
      <div className="bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] shadow-sm overflow-hidden">
        {(institutes ?? []).length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">🏫</p>
            <p className="text-[var(--ag-text-muted)]">No se encontraron institutos</p>
            <Link
              href="/dashboard/super-admin/institutes/new"
              className="inline-block mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[var(--ag-navy)]"
            >
              Crear el primero
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-[var(--ag-border-light)] bg-[var(--ag-surface-alt)]">
                <th className="text-left px-6 py-3.5 font-semibold text-[var(--ag-text-muted)]">Instituto</th>
                <th className="text-left px-4 py-3.5 font-semibold text-[var(--ag-text-muted)]">Slug</th>
                <th className="text-center px-4 py-3.5 font-semibold text-[var(--ag-text-muted)]">Usuarios</th>
                <th className="text-center px-4 py-3.5 font-semibold text-[var(--ag-text-muted)]">Cursos</th>
                <th className="text-center px-4 py-3.5 font-semibold text-[var(--ag-text-muted)]">Estado</th>
                <th className="text-right px-6 py-3.5 font-semibold text-[var(--ag-text-muted)]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(institutes ?? []).map((inst: { id: string; name: string; slug: string; domain: string | null; primary_color: string | null; secondary_color: string | null; active: boolean }) => (
                <tr key={inst.id} className="border-b border-[var(--ag-border-light)] last:border-0 hover:bg-[var(--ag-surface-alt)] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: inst.primary_color ?? 'var(--ag-navy)' }}
                      >
                        {inst.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-[var(--ag-text)]">{inst.name}</p>
                        {inst.domain && (
                          <p className="text-xs text-[var(--ag-text-muted)]">{inst.domain}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[var(--ag-text-muted)]">{inst.slug}</td>
                  <td className="px-4 py-4 text-center font-medium text-[var(--ag-text)]">
                    {usersByInstitute[inst.id] ?? 0}
                  </td>
                  <td className="px-4 py-4 text-center font-medium text-[var(--ag-text)]">
                    {coursesByInstitute[inst.id] ?? 0}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      inst.active
                        ? 'bg-green-100/60 text-green-700'
                        : 'bg-red-100/60 text-red-600'
                    }`}>
                      {inst.active ? '● Activo' : '● Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/super-admin/institutes/${inst.id}`}
                      className="text-xs font-medium text-[var(--ag-navy)] hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* ── Paginación ── */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?q=${q}&status=${status}&page=${p}`}
              className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                p === currentPage
                  ? 'text-
