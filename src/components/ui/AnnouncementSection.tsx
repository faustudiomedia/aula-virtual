'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Announcement } from '@/lib/types'
import { createAnnouncement, deleteAnnouncement } from '@/app/actions/campus'

interface Props {
  announcements: Announcement[]
  courseId: string
  isTeacher?: boolean
}

export default function AnnouncementSection({ announcements, courseId, isTeacher = false }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    if (!title.trim() || !body.trim()) { setError('Completá título y contenido'); return }
    setError(null)
    startTransition(async () => {
      const res = await createAnnouncement(courseId, title, body)
      if (!res.success) { setError(res.error ?? 'Error'); return }
      setTitle(''); setBody(''); setShowForm(false); router.refresh()
    })
  }

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar este anuncio?')) return
    startTransition(async () => {
      await deleteAnnouncement(id, courseId)
      router.refresh()
    })
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-[#050F1F] flex items-center gap-2">
          📢 Anuncios
          {announcements.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">{announcements.length}</span>
          )}
        </h2>
        {isTeacher && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 transition"
          >
            {showForm ? 'Cancelar' : '+ Nuevo anuncio'}
          </button>
        )}
      </div>

      {/* Form */}
      {isTeacher && showForm && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 mb-4 space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <input
            value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Título del anuncio..."
            className="w-full px-4 py-2 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
          <textarea
            value={body} onChange={(e) => setBody(e.target.value)}
            placeholder="Escribí tu anuncio..."
            rows={3}
            className="w-full px-4 py-2 rounded-lg border border-amber-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
          <button onClick={handleCreate} disabled={isPending}
            className="px-5 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition disabled:opacity-60">
            {isPending ? 'Publicando...' : 'Publicar anuncio'}
          </button>
        </div>
      )}

      {/* List */}
      {announcements.length === 0 ? (
        <p className="text-sm text-[#050F1F]/40 italic">No hay anuncios todavía.</p>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <div key={ann.id} className={`rounded-xl border p-4 ${ann.pinned ? 'bg-amber-50 border-amber-200' : 'bg-white border-black/5'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {ann.pinned && <span className="text-xs">📌</span>}
                    <h3 className="text-sm font-semibold text-[#050F1F]">{ann.title}</h3>
                  </div>
                  <p className="text-sm text-[#050F1F]/70 whitespace-pre-wrap leading-relaxed">{ann.body}</p>
                  <p className="text-xs text-[#050F1F]/40 mt-2">
                    {ann.author?.full_name ?? 'Profesor'} · {formatDate(ann.created_at)}
                  </p>
                </div>
                {isTeacher && (
                  <button onClick={() => handleDelete(ann.id)}
                    className="text-red-400 hover:text-red-600 text-xs flex-shrink-0 transition">
                    🗑
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
