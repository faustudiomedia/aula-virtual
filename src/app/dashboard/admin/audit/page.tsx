import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { AuditLog } from '@/lib/types'

const ACTION_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  CREATE: { label: 'Creó', color: '#059669', bg: '#ECFDF5' },
  UPDATE: { label: 'Editó', color: '#D97706', bg: '#FFFBEB' },
  DELETE: { label: 'Eliminó', color: '#DC2626', bg: '#FEF2F2' },
}

const ENTITY_ICONS: Record<string, string> = {
  course: '📚',
  institute: '🏫',
  user: '👤',
  material: '📄',
  quiz: '🧠',
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entity_type?: string; action?: string; page?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard/admin')

  const PAGE_SIZE = 25
  const page = Number(params.page) || 1
  const from = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('audit_log')
    .select('*, profiles(full_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)

  if (params.entity_type) query = query.eq('entity_type', params.entity_type)
  if (params.action) query = query.eq('action', params.action)

  const { data: logs, count } = await query
  const logList = (logs ?? []) as AuditLog[]
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--ag-text)]">Registro de auditoría</h1>
        <p className="text-[var(--ag-text-muted)] mt-1">Historial completo de acciones en la plataforma.</p>
      </div>

      {/* Filters */}
      <form className="flex gap-3 mb-6">
        <select
          name="entity_type"
          defaultValue={params.entity_type ?? ''}
          className="px-3 py-2 rounded-xl border border-[var(--ag-border)] text-sm text-[var(--ag-text)] bg-[var(--ag-bg)] text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 focus:border-[var(--ag-navy)] transition bg-[var(--ag-surface)]"
        >
          <option value="">Todas las entidades</option>
          {['course', 'institute', 'user', 'material', 'quiz'].map((e) => (
            <option key={e} value={e}>{ENTITY_ICONS[e]} {e.charAt(0).toUpperCase() + e.slice(1)}</option>
          ))}
        </select>

        <select
          name="action"
          defaultValue={params.action ?? ''}
          className="px-3 py-2 rounded-xl border border-[var(--ag-border)] text-sm text-[var(--ag-text)] bg-[var(--ag-bg)] text-[var(--ag-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 focus:border-[var(--ag-navy)] transition bg-[var(--ag-surface)]"
        >
          <option value="">Todas las acciones</option>
          {['CREATE', 'UPDATE', 'DELETE'].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-[var(--ag-navy)] text-white text-sm font-medium hover:opacity-90 transition"
        >
          Filtrar
        </button>

        {(params.entity_type || params.action) && (
          <a
            href="/dashboard/admin/audit"
            className="px-4 py-2 rounded-xl border border-[var(--ag-border)] text-sm text-[var(--ag-text-muted)] hover:bg-[var(--ag-surface-alt)] transition"
          >
            Limpiar
          </a>
        )}
      </form>

      {/* Log table */}
      {logList.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--ag-border-light)] p-12 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-[var(--ag-text-muted)]">No hay registros de auditoría todavía.</p>
          <p className="text-xs text-[var(--ag-text)]/30 mt-2">
            Los registros aparecen cuando se crean, editan o eliminan entidades en la plataforma.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] shadow-sm overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-[rgba(30,58,95,0.06)] border-b border-[var(--ag-border-light)]">
                <tr>
                  <th className="text-left px-5 py-3 text-[var(--ag-text-muted)] font-medium">Usuario</th>
                  <th className="text-left px-5 py-3 text-[var(--ag-text-muted)] font-medium">Acción</th>
                  <th className="text-left px-5 py-3 text-[var(--ag-text-muted)] font-medium">Entidad</th>
                  <th className="text-left px-5 py-3 text-[var(--ag-text-muted)] font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ag-border-light)]">
                {logList.map((log) => {
                  const actionMeta = ACTION_LABELS[log.action]
                  const prof = log.profiles
                  return (
                    <tr key={log.id} className="hover:bg-[rgba(30,58,95,0.06)]/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="font-medium text-[var(--ag-text)] text-xs">
                            {prof?.full_name || prof?.email || 'Sistema'}
                          </p>
                          {prof?.full_name && (
                            <p className="text-xs text-[var(--ag-text-muted)]">{prof.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{ color: actionMeta?.color, background: actionMeta?.bg }}
                        >
                          {actionMeta?.label ?? log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span>{ENTITY_ICONS[log.entity_type] ?? '•'}</span>
                          <span className="text-[var(--ag-text)]/70 capitalize">{log.entity_type}</span>
                          {log.entity_id && (
                            <span className="text-[var(--ag-text)]/30 text-xs font-mono truncate max-w-[100px]">
                              {log.entity_id.slice(0, 8)}…
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[var(--ag-text-muted)] text-xs">
                        {new Date(log.created_at).toLocaleString('es-AR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination links */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {page > 1 && (
                <a
                  href={`/dashboard/admin/audit?page=${page - 1}${params.entity_type ? `&entity_type=${params.entity_type}` : ''}${params.action ? `&action=${params.action}` : ''}`}
                  className="px-3 py-2 rounded-lg border border-[var(--ag-border)] text-sm hover:bg-[var(--ag-surface-alt)] transition"
                >
                  ← Anterior
                </a>
              )}
              <span className="text-sm text-[var(--ag-text-muted)]">Página {page} de {totalPages}</span>
              {page < totalPages && (
                <a
                  href={`/dashboard/admin/audit?page=${page + 1}${params.entity_type ? `&entity_type=${params.entity_type}` : ''}${params.action ? `&action=${params.action}` : ''}`}
                  className="px-3 py-2 rounded-lg border 