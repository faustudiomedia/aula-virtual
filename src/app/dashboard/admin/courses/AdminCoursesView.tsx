'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useCourses, useEnrollmentCounts } from '@/lib/hooks/use-data'

const PAGE_SIZE = 20

export default function AdminCoursesView() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const q = searchParams.get('q') ?? ''
  const currentPage = Math.max(1, parseInt(searchParams.get('page') ?? '1') || 1)

  const { data, isLoading } = useCourses({ search: q, page: currentPage, pageSize: PAGE_SIZE })
  const courses = data?.courses ?? []
  const count = data?.count ?? 0
  const totalPages = Math.ceil(count / PAGE_SIZE)

  const courseIds = courses.map((c) => c.id)
  const { data: countMap = {} } = useEnrollmentCounts(courseIds)

  function buildUrl(params: Record<string, string>) {
    const p = new URLSearchParams({ q, page: String(currentPage), ...params })
    return `?${p.toString()}`
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const search = (fd.get('q') as string) ?? ''
    const p = new URLSearchParams({ q: search, page: '1' })
    router.push(`?${p.toString()}`)
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-[#050F1F] mb-2">Todos los cursos</h1>
      <p className="text-[#050F1F]/50 mb-6">{count} cursos en la plataforma.</p>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#050F1F]/30 text-sm">🔍</span>
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar cursos por título..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition"
          />
        </div>
        <button type="submit"
          className="px-5 py-2.5 rounded-xl bg-[#1A56DB] text-white text-sm font-semibold hover:opacity-90 transition">
          Buscar
        </button>
        {q && (
          <a href="/dashboard/admin/courses"
            className="px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[#050F1F]/60 hover:bg-black/5 transition">
            Limpiar
          </a>
        )}
      </form>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden mb-4 animate-pulse">
          <div className="h-64" />
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#BAE6FD] p-10 text-center">
          <p className="text-[#050F1F]/50">No se encontraron cursos con esos filtros.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden mb-4">
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
                {courses.map((c) => (
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#050F1F]/50">
                Página {currentPage} de {totalPages} · {count} resultados
              </p>
              <div className="flex gap-2">
                {currentPage > 1 && (
                  <a href={buildUrl({ page: String(currentPage - 1) })}
                    className="px-4 py-2 rounded-xl border border-black/10 text-sm text-[#050F1F]/70 font-medium hover:bg-black/5 transition">
                    ← Anterior
                  </a>
                )}
                {currentPage < totalPages && (
                  <a href={buildUrl({ page: String(currentPage + 1) })}
                    className="px-4 py-2 rounded-xl bg-[#1A56DB] text-white text-sm font-medium hover:opacity-90 transition">
                    Siguiente →
                  </a>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
