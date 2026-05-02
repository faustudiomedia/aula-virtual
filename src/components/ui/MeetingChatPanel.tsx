'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  profiles: { full_name: string } | null
}

interface Props {
  meetingId: string
  userId: string
  displayName: string
}

export function MeetingChatPanel({ meetingId, userId, displayName }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase  = useRef(createClient())

  useEffect(() => {
    const sb = supabase.current

    sb.from('meeting_messages')
      .select('id, sender_id, content, created_at, profiles(full_name)')
      .eq('meeting_id', meetingId)
      .order('created_at')
      .then(({ data }) => {
        if (data) setMessages(data as unknown as Message[])
      })

    const channel = sb
      .channel(`meeting-chat-${meetingId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'meeting_messages', filter: `meeting_id=eq.${meetingId}` },
        async (payload) => {
          const row = payload.new as { id: string; sender_id: string; content: string; created_at: string }
          const { data: profile } = await sb.from('profiles').select('full_name').eq('id', row.sender_id).maybeSingle()
          setMessages(prev => [...prev, { ...row, profiles: profile ?? null }])
        }
      )
      .subscribe()

    return () => { sb.removeChannel(channel) }
  }, [meetingId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const content = input.trim()
    if (!content || sending) return
    setSending(true)
    setInput('')
    await supabase.current.from('meeting_messages').insert({
      meeting_id: meetingId,
      sender_id: userId,
      content,
    })
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col h-full bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--ag-border-light)]">
        <p className="text-sm font-semibold text-[var(--ag-text)]">Chat de la reunión</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.length === 0 && (
          <p className="text-xs text-[var(--ag-text)]/30 text-center py-6">No hay mensajes todavía.</p>
        )}
        {messages.map(m => {
          const isMine = m.sender_id === userId
          return (
            <div key={m.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
              {!isMine && (
                <p className="text-[10px] text-[var(--ag-text-muted)] mb-0.5 px-1">
                  {m.profiles?.full_name ?? 'Desconocido'}
                </p>
              )}
              <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                isMine ? 'bg-[var(--ag-navy)] text-white rounded-br-sm' : 'bg-[rgba(30,58,95,0.06)] text-[var(--ag-text)] rounded-bl-sm'
              }`}>
                <p className="break-words whitespace-pre-wrap">{m.content}</p>
                <p className={`text-[9px] mt-0.5 ${isMine ? 'text-white/60' : 'text-[var(--ag-text)]/30'}`}>
                  {new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-[var(--ag-border-light)] flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Mensaje... (Enter para enviar)"
          className="flex-1 px-3 py-2 rounded-xl border border-[var(--ag-border)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30"
          disabled={sending}
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className="px-3 py-2 rounded-xl bg-[var(--ag-navy)] text-white text-xs font-semibold hover:bg-[var(--ag-navy)]/90 disabled:opacity-40 transition-all"
 
