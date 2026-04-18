'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import FileUpload from '@/components/ui/FileUpload'
import { submitAssignment } from '@/app/actions/assignments'

interface Props {
  assignmentId: string
  defaultContent?: string
  isResubmit?: boolean
}

export function SubmitAssignmentForm({ assignmentId, defaultContent = '', isResubmit = false }: Props) {
  const [fileUrl, setFileUrl] = useState('')
  const [fileError, setFileError] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    if (fileUrl) formData.set('file_url', fileUrl)

    startTransition(async () => {
      const result = await submitAssignment(assignmentId, formData)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[#050F1F] mb-1.5">Tu respuesta</label>
        <textarea
          name="content"
          rows={7}
          defaultValue={defaultContent}
          placeholder="Escribí tu respuesta aquí..."
          className="w-full px-4 py-3 rounded-xl border border-black/10 text-sm text-[#050F1F] resize-none focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#050F1F] mb-1.5">
          Archivo adjunto <span className="text-[#050F1F]/40 font-normal">(opcional)</span>
        </label>
        <FileUpload
          folder="submissions"
          onUpload={setFileUrl}
          onError={setFileError}
        />
        {fileError && <p className="text-xs text-red-500 mt-1">{fileError}</p>}
        {fileUrl && <p className="text-xs text-green-600 mt-1">✓ Archivo listo para enviar</p>}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="px-6 py-2.5 rounded-xl bg-[#1A56DB] text-white text-sm font-semibold hover:bg-[#1A56DB]/90 transition-all disabled:opacity-50 shadow-lg shadow-[#1A56DB]/20"
      >
        {isPending ? 'Enviando...' : isResubmit ? 'Re-entregar tarea' : 'Entregar tarea'}
      </button>
    </form>
  )
}
