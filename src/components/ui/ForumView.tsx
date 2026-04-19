'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { DiscussionThread, DiscussionReply } from '@/lib/types'
import { createThread, createReply } from '@/app/actions/campus'

const ROLE_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  admin:    { label: 'Admin',    color: '#DC2626', bg: '#FEF2F2' },
  profesor: { label: 'Profesor', color: '#7C3AED', bg: '#F5F3FF' },
  alumno:   { label: 'Alumno',  color: '#059669', bg: '#ECFDF5' },
}

interface Props {
  threads: DiscussionThread[]
  repliesByThread: Record<string, DiscussionReply[]>
  courseId: string
  courseTitle: string
}

export default function ForumView({ threads, repliesByThread, courseId, courseTitle }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showNewThread, setShowNewThread] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [openThread, setOpenThread] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleCreateThread() {
    if (!newTitle.trim() || !newBody.trim()) { setError('Completá título y mensaje'); return }
    setError(null)
    startTransition(async () => {
      const res = await createThread(courseId, newTitle, newBody)
      if (!res.success) { setError(res.error ?? 'Error'); return }
      setNewTitle(''); setNewBody(''); setShowNewThread(false); router.refresh()
    })
  }

  function handleReply(threadId: string) {
    if (!replyBody.trim()) return
    startTransition(async () => {
      await createReply(threadId, courseId, replyBody)
      setReplyBody(''); router.refresh()
    })
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-[#050F1F]">💬 Foro de discusión</h2>
          <p className="text-sm text-[#050F1F]/50">{courseTitle}</p>
        </div>
        <button
          onClick={() => { setShowNewThread(!showNewThread); setError(null) }}
          className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#1A56DB] text-white hover:opacity-90 transition shadow-lg shadow-[#1A56DB]/20"
        >
          {showNewThread ? 'Cancelar' : '+ Nuevo tema'}
        </button>
      </div>

      {/* New thread form */}
      {showNewThread && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 mb-6 space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <input
            value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Título del tema..."
            className="w-full px-4 py-2 rounded-lg border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <textarea
            value={newBody} onChange={(e) => setNewBody(e.target.value)}
            placeholder="Describí tu pregunta o tema de discusión..."
            rows={3}
            className="w-full px-4 py-2 rounded-lg border border-blue-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button onClick={handleCreateThread} disabled={isPending}
            className="px-5 py-2 rounded-lg bg-[#1A56DB] text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-60">
            {isPending ? 'Publicando...' : 'Publicar tema'}
          </button>
        </div>
      )}

      {/* Thread list */}
      {threads.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#BAE6FD] p-10 text-center">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-[#050F1F]/50">No hay temas de discusión todavía. ¡Sé el primero!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => {
            const isOpen = openThread === thread.id
            const replies = repliesByThread[thread.id] ?? []
            const role = ROLE_STYLE[thread.author?.role ?? 'alumno'] ?? ROLE_STYLE.alumno
            return (
              <div key={thread.id} className="bg-white rounded-xl border border-black/5 overflow-hidden transition-shadow hover:shadow-sm">
                {/* Thread header */}
                <button
                  type="button"
                  onClick={() => setOpenThread(isOpen ? null : thread.id)}
                  className="w-full text-left p-4 flex items-start gap-3 cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1A56DB] to-[#38BDF8] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    {(thread.author?.full_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-[#050F1F]">{thread.title}</span>
                      {thread.is_pinned && <span className="text-xs">📌</span>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#050F1F]/50">
                      <span>{thread.author?.full_name || 'Usuario'}</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ color: role.color, background: role.bg }}>{role.label}</span>
                      <span>· {formatDate(thread.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-[#050F1F]/40 bg-black/5 px-2 py-1 rounded-lg">
                      💬 {replies.length}
                    </span>
                    <span className={`text-xs text-[#050F1F]/30 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                  </div>
                </button>

                {/* Thread body + replies */}
                {isOpen && (
                  <div className="border-t border-black/5">
                    <div className="p-4 bg-[#F8FAFC]">
                      <p className="text-sm text-[#050F1F]/80 whitespace-pre-wrap leading-relaxed">{thread.body}</p>
                    </div>

                    {/* Replies */}
                    {replies.length > 0 && (
                      <div className="border-t border-black/5">
                        {replies.map((reply) => {
                          const rRole = ROLE_STYLE[reply.author?.role ?? 'alumno'] ?? ROLE_STYLE.alumno
                          return (
                            <div key={reply.id} className="p-4 border-b border-black/5 last:border-0 flex gap-3">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">
                                {(reply.author?.full_name || '?').charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium text-[#050F1F]">{reply.author?.full_name || 'Usuario'}</span>
                                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ color: rRole.color, background: rRole.bg }}>{rRole.label}</span>
                                  <span className="text-xs text-[#050F1F]/40">· {formatDate(reply.created_at)}</span>
                                </div>
                                <p className="text-sm text-[#050F1F]/70 whitespace-pre-wrap">{reply.body}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Reply form */}
                    <div className="p-4 bg-[#F8FAFC] border-t border-black/5 flex gap-2">
                      <input
                        value={replyBody} onChange={(e) => setReplyBody(e.target.value)}
                        placeholder="Escribí tu respuesta..."
                        className="flex-1 px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(thread.id) } }}
                      />
                      <button
                        onClick={() => handleReply(thread.id)}
                        disabled={isPending}
                        className="px-4 py-2 rounded-lg bg-[#1A56DB] text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
                      >
                        Enviar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
