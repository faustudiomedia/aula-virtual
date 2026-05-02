'use client'

import { useRef, useTransition } from 'react'
import { sendMessage } from '@/app/actions/messages'

export function MessageInput({ recipientId }: { recipientId: string }) {
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  function submit() {
    if (!formRef.current) return
    const formData = new FormData(formRef.current)
    if (!(formData.get('content') as string)?.trim()) return
    startTransition(async () => {
      await sendMessage(recipientId, formData)
      formRef.current?.reset()
      inputRef.current?.focus()
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <form ref={formRef} onSubmit={e => { e.preventDefault(); submit() }}
      className="flex gap-3 p-4 bg-white border-t border-black/5 items-end"
    >
      <textarea
        ref={inputRef}
        name="content"
        required
        rows={1}
        autoComplete="off"
        onKeyDown={handleKeyDown}
        className="flex-1 px-4 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 resize-none"
        placeholder="Escribe un mensaje… (Enter para enviar, Shift+Enter para nueva línea)"
        disabled={pending}
      />
      <button
        type="submit"
        disabled={pending}
        className="px-5 py-2.5 rounded-xl bg-[var(--ag-navy)] text-white text-sm font-medium hover:bg-[var(--ag-navy)]/90 disabled:opacity-50 transition-all flex-shrink-0"
      >
        {pending ? '...' : 'Enviar'}
      </button>
    </form>
  )
}
