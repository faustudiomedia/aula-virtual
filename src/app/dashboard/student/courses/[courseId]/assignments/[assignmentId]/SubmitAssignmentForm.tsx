'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import FileUpload from '@/components/ui/FileUpload'
import { submitAssignment } from '@/app/actions/assignments'

const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor'), { ssr: false })

interface Props {
  assignmentId: string
  defaultContent?: string
  isResubmit?: boolean
}

export function SubmitAssignmentForm({ assignmentId, defaultContent = '', isResubmit = false }: Props) {
  const [fileUrl, setFileUrl] = useState('')
  const [fileError, setFileError] = useState('')
  const [editorContent, setEditorContent] = useState(defaultContent)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    formData.set('content', editorContent)
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
        <label className="block text-sm font-medium text-[var(--ag-text)] mb-2">Tu respuesta</label>
        <RichTextEditor
          content={defaultContent}
          onChange={setEditorContent}
          placeholder="Escribí tu trabajo aquí. Podés usar negrita, listas, títulos y más..."
          minHeight={280}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--ag-text)] mb-1.5">
          Archivo adjunto <span className="text-[var(--ag-text-muted)] font-normal">(opcional)</span>
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
        className="px-6 py-2.5 rounded-xl bg-[var(--ag-navy)] text-white text-sm font-semibold hover:bg-[var(--ag-navy)]/90 transition-all disabled:opacity-50 shadow-lg "
      >
        {isPending ? 'Enviando...' : isResubmit ? 'Re-entregar tarea' : 'Entregar tarea'}
      </button>
    </form>
  )
}
