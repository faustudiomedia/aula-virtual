'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { searchUsers } from '@/app/actions/messages'

type User = { id: string; full_name: string; role: string }

export function NewMessageModal() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<User[]>([])
  const [, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    startTransition(async () => {
      const users = await searchUsers(query)
      setResults(users)
    })
  }, [query])

  function handleSelect(userId: string) {
    setOpen(false)
    setQuery('')
    setResults([])
    router.push(`/dashboard/messages/${userId}`)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-xl bg-[var(--ag-navy)] text-white text-sm font-medium hover:bg-[var(--ag-navy)]/90 transition-all"
      >
        + Nuevo mensaje
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/30 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="p-4 border-b border-black/5">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--ag-text-muted)] mb-2">
                Nuevo mensaje
              </p>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar por nombre..."
                className="w-full px-3 py-2 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30"
              />
            </div>

            <div className="max-h-60 overflow-y-auto">
              {query.trim() && results.length === 0 && (
                <p className="text-center text-sm text-[var(--ag-text-muted)] py-8">
                  No se encontraron usuarios
                </p>
              )}
              {results.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleSelect(u.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-[rgba(30,58,95,0.08)] flex items-center justify-center text-[var(--ag-navy)] font-semibold text-sm flex-shrink-0">
                    {u.full_name?.charAt(0) ?? '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--ag-text)]">{u.full_name}</p>
                    <p className="text-xs text-[var(--ag-text-muted)]">
                      {u.role === 'profesor' ? 'Profesor' : u.role === 'admin' ? 'Admin' : 'Alumno'}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {!query.trim() && (
              <p className="text-center text-xs text-[var(--ag-text)]/30 py-5">
                Escribí un nombre para buscar
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
