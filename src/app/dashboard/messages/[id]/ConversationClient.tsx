'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage, markMessagesAsRead } from '@/app/actions/messages'

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
}

interface Props {
  currentUserId: string
  otherUserId: string
  initialMessages: Message[]
}

export function ConversationClient({ currentUserId, otherUserId, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Mark as read when conversation opens
  useEffect(() => {
    markMessagesAsRead(otherUserId)
  }, [otherUserId])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime: only incoming messages (outgoing handled by server action return value)
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`conv-in:${[currentUserId, otherUserId].sort().join(':')}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${currentUserId}` },
        (payload) => {
          if (payload.new.sender_id !== otherUserId) return
          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev
            return [...prev, payload.new as Message]
          })
          markMessagesAsRead(otherUserId)
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentUserId, otherUserId])

  function submit() {
    if (!formRef.current) return
    const formData = new FormData(formRef.current)
    const content = (formData.get('content') as string)?.trim()
    if (!content) return

    formRef.current.reset()
    inputRef.current?.focus()

    // Add optimistic message
    const tempId = `temp-${Date.now()}`
    const tempMsg: Message = {
      id: tempId,
      sender_id: currentUserId,
      content,
      created_at: new Date().toISOString(),
      read_at: null,
    }
    setMessages(prev => [...prev, tempMsg])

    // Send and replace temp with real message on success
    startTransition(async () => {
      const saved = await sendMessage(otherUserId, content)
      if (saved) {
        setMessages(prev => {
          const idx = prev.findIndex(m => m.id === tempId)
          if (idx < 0) return prev
          const updated = [...prev]
          updated[idx] = saved as Message
          return updated
        })
      } else {
        // Remove failed temp message
        setMessages(prev => prev.filter(m => m.id !== tempId))
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#F8FAFC]">
        {messages.length === 0 && (
          <p className="text-center text-sm text-[#050F1F]/40 py-8">
            No hay mensajes todavía. ¡Iniciá la conversación!
          </p>
        )}
        {messages.map(m => {
          const isMine = m.sender_id === currentUserId
          const isTemp = m.id.startsWith('temp-')
          return (
            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-opacity duration-300 ${
                  isMine
                    ? 'bg-[#1A56DB] text-white rounded-br-sm'
                    : 'bg-white text-[#050F1F] border border-black/5 rounded-bl-sm'
                } ${isTemp ? 'opacity-60' : 'opacity-100'}`}
              >
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-[#050F1F]/30'}`}>
                  {new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  {isMine && isTemp && ' · Enviando…'}
                  {isMine && !isTemp && m.read_at && ' · Leído'}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form
        ref={formRef}
        onSubmit={e => { e.preventDefault(); submit() }}
        className="flex gap-3 p-4 bg-white border-t border-black/5 items-end flex-shrink-0"
      >
        <textarea
          ref={inputRef}
          name="content"
          required
          rows={1}
          autoComplete="off"
          onKeyDown={handleKeyDown}
          className="flex-1 px-4 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30 resize-none"
          placeholder="Escribe un mensaje… (Enter para enviar)"
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-[#1A56DB] text-white text-sm font-medium hover:bg-[#1A56DB]/90 transition-all flex-shrink-0"
        >
          Enviar
        </button>
      </form>
    </>
  )
}
