'use client'

import { useFormStatus } from 'react-dom'

interface SubmitButtonProps {
  label?: string
  loadingLabel?: string
  className?: string
}

export default function SubmitButton({ label = 'Guardar', loadingLabel = 'Guardando...', className }: SubmitButtonProps) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={`flex-1 py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#1A56DB] to-[#38BDF8] text-white font-semibold text-sm shadow-lg shadow-[#1A56DB]/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed ${className ?? ''}`}
    >
      {pending ? loadingLabel : label}
    </button>
  )
}
