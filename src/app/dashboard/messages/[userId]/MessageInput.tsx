'use client'

import { useRef, useTransition } from 'react'
import { sendMessage } from '@/app/actions/messages'

export function MessageInput({ recipientId }: { recipientId: string }) {
  const [pending, startTransition] = useTransition()
  const ref = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await sendMessage(recipientId, formData)
      ref.current?.reset()
    })
  }

  return (
    <form ref={ref} action={handleSubmit} className="flex gap-3 p-4 bg-white border-t border-black/5">
      <input
        name="content"
        required
        autoComplete="off"
        className="flex-1 px-4 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30"
        placeholder="Escribe un mensaje..."
        disabled={pending}
      />
      <button
        type="submit"
        disabled={pending}
        className="px-5 py-2.5 rounded-xl bg-[#1A56DB] text-white text-sm font-medium hover:bg-[#1A56DB]/90 disabled:opacity-50 transition-all"
      >
        Enviar
      </button>
    </form>
  )
}
