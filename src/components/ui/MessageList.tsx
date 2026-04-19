'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Message } from '@/lib/types'
import { sendMessage, markMessageRead } from '@/app/actions/messages'

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  admin:    { label: 'Admin',    color: '#DC2626', bg: '#FEF2F2' },
  profesor: { label: 'Profesor', color: '#7C3AED', bg: '#F5F3FF' },
  alumno:   { label: 'Alumno',  color: '#059669', bg: '#ECFDF5' },
}

type Contact = { id: string; full_name: string; email: string; role: string; avatar_url: string | null }

interface Props {
  received: Message[]
  sent: Message[]
  contacts: Contact[]
}

export default function MessageList({ received, sent, contacts }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'inbox' | 'sent' | 'compose'>('inbox')
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null)
  const [isPending, startTransition] = useTransition()

  // Compose state
  const [recipientId, setRecipientId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const unreadCount = received.filter((m) => !m.is_read).length

  function openMessage(msg: Message) {
    setSelectedMsg(msg)
    if (!msg.is_read && msg.recipient_id !== undefined) {
      // Mark as read
      startTransition(async () => {
        await markMessageRead(msg.id)
        router.refresh()
      })
    }
  }

  function handleSend() {
    if (!recipientId || !body.trim()) {
      setError('Seleccioná un destinatario y escribí un mensaje')
      return
    }
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await sendMessage(recipientId, subject, body)
      if (!result.success) {
        setError(result.error ?? 'Error al enviar')
        return
      }
      setSuccess(true)
      setRecipientId('')
      setSubject('')
      setBody('')
      setTimeout(() => { setSuccess(false); setTab('sent'); router.refresh() }, 1500)
    })
  }

  function replyTo(msg: Message) {
    const senderName = msg.sender?.full_name || msg.sender?.email || ''
    setRecipientId(msg.sender_id)
    setSubject(`Re: ${msg.subject}`)
    setBody(`\n\n--- Mensaje original de ${senderName} ---\n${msg.body}`)
    setTab('compose')
    setSelectedMsg(null)
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex gap-6">
      {/* Sidebar tabs */}
      <div className="w-48 flex-shrink-0 space-y-1">
        <button onClick={() => { setTab('inbox'); setSelectedMsg(null) }}
          className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
            tab === 'inbox' ? 'bg-[#1A56DB] text-white shadow' : 'text-[#050F1F]/60 hover:bg-black/5'
          }`}>
          <span>📥 Recibidos</span>
          {unreadCount > 0 && (
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
              tab === 'inbox' ? 'bg-white/30 text-white' : 'bg-red-500 text-white'
            }`}>{unreadCount}</span>
          )}
        </button>
        <button onClick={() => { setTab('sent'); setSelectedMsg(null) }}
          className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            tab === 'sent' ? 'bg-[#1A56DB] text-white shadow' : 'text-[#050F1F]/60 hover:bg-black/5'
          }`}>
          📤 Enviados
        </button>
        <button onClick={() => { setTab('compose'); setSelectedMsg(null); setError(null); setSuccess(false) }}
          className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            tab === 'compose' ? 'bg-[#059669] text-white shadow' : 'text-[#059669] hover:bg-green-50 border border-green-200'
          }`}>
          ✏️ Nuevo mensaje
        </button>
      </div>

      {/* Main area */}
      <div className="flex-1 min-w-0">
        {/* ── COMPOSE ─────────────────────────────────────────── */}
        {tab === 'compose' && (
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[#050F1F]">Nuevo mensaje</h2>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{error}</p>}
            {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2">✅ Mensaje enviado correctamente</p>}

            <div>
              <label className="block text-sm font-medium text-[#050F1F] mb-1.5">Destinatario *</label>
              <select
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition"
              >
                <option value="">Seleccioná un contacto...</option>
                {contacts.map((c) => {
                  const role = ROLE_LABELS[c.role] ?? ROLE_LABELS.alumno
                  return (
                    <option key={c.id} value={c.id}>
                      {c.full_name || c.email} ({role.label})
                    </option>
                  )
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#050F1F] mb-1.5">Asunto</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Asunto del mensaje..."
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#050F1F] mb-1.5">Mensaje *</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                placeholder="Escribí tu mensaje..."
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={isPending}
              className="w-full py-2.5 rounded-xl bg-[#1A56DB] text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-60 shadow-lg shadow-[#1A56DB]/20"
            >
              {isPending ? 'Enviando...' : 'Enviar mensaje'}
            </button>
          </div>
        )}

        {/* ── INBOX / SENT LIST ───────────────────────────────── */}
        {(tab === 'inbox' || tab === 'sent') && !selectedMsg && (
          <div className="space-y-2">
            {(tab === 'inbox' ? received : sent).length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-[#BAE6FD] p-10 text-center">
                <p className="text-4xl mb-3">{tab === 'inbox' ? '📭' : '📤'}</p>
                <p className="text-[#050F1F]/50">
                  {tab === 'inbox' ? 'No tenés mensajes nuevos.' : 'No enviaste ningún mensaje todavía.'}
                </p>
              </div>
            ) : (
              (tab === 'inbox' ? received : sent).map((msg) => {
                const person = tab === 'inbox' ? msg.sender : msg.recipient
                const role = ROLE_LABELS[person?.role ?? 'alumno'] ?? ROLE_LABELS.alumno
                const isUnread = tab === 'inbox' && !msg.is_read
                return (
                  <button
                    key={msg.id}
                    onClick={() => openMessage(msg)}
                    className={`w-full text-left bg-white rounded-xl border p-4 flex items-center gap-4 transition-all hover:shadow-md cursor-pointer ${
                      isUnread ? 'border-[#1A56DB]/30 bg-blue-50/30' : 'border-black/5'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1A56DB] to-[#38BDF8] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {(person?.full_name || person?.email || '?').charAt(0).toUpperCase()}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-sm ${isUnread ? 'font-bold text-[#050F1F]' : 'font-medium text-[#050F1F]'}`}>
                          {person?.full_name || person?.email || 'Usuario'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ color: role.color, background: role.bg }}>
                          {role.label}
                        </span>
                        {isUnread && <span className="w-2 h-2 rounded-full bg-[#1A56DB]" />}
                      </div>
                      <p className={`text-sm truncate ${isUnread ? 'font-semibold text-[#050F1F]' : 'text-[#050F1F]/70'}`}>
                        {msg.subject || '(Sin asunto)'}
                      </p>
                      <p className="text-xs text-[#050F1F]/40 truncate mt-0.5">{msg.body}</p>
                    </div>

                    {/* Date */}
                    <span className="text-xs text-[#050F1F]/40 flex-shrink-0">{formatDate(msg.created_at)}</span>
                  </button>
                )
              })
            )}
          </div>
        )}

        {/* ── MESSAGE DETAIL ──────────────────────────────────── */}
        {selectedMsg && (
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
            <button
              onClick={() => setSelectedMsg(null)}
              className="text-[#1A56DB] hover:underline text-sm mb-4 inline-flex items-center gap-1"
            >
              ← Volver
            </button>

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1A56DB] to-[#38BDF8] flex items-center justify-center text-white font-bold flex-shrink-0">
                {((tab === 'inbox' ? selectedMsg.sender : selectedMsg.recipient)?.full_name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-[#050F1F]">{selectedMsg.subject || '(Sin asunto)'}</h2>
                </div>
                <p className="text-sm text-[#050F1F]/50">
                  {tab === 'inbox' ? 'De' : 'Para'}:{' '}
                  <strong>{(tab === 'inbox' ? selectedMsg.sender : selectedMsg.recipient)?.full_name || 'Usuario'}</strong>
                  {' · '}
                  {formatDate(selectedMsg.created_at)}
                </p>
              </div>
            </div>

            <div className="bg-[#F8FAFC] rounded-xl p-5 text-sm text-[#050F1F]/80 leading-relaxed whitespace-pre-wrap border border-black/5">
              {selectedMsg.body}
            </div>

            {tab === 'inbox' && (
              <button
                onClick={() => replyTo(selectedMsg)}
                className="mt-4 px-5 py-2 rounded-xl bg-[#1A56DB] text-white text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-[#1A56DB]/20"
              >
                ↩ Responder
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
