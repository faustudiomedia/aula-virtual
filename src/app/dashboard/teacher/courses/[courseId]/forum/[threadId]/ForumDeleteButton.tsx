'use client'

import { useTransition } from 'react'
import { deleteThread } from '@/app/actions/forum'
import { useRouter } from 'next/navigation'

interface Props {
  threadId: string
  courseId: string
}

export function ForumDeleteButton({ threadId, courseId }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (!confirm('¿Eliminar este tema y todas sus respuestas? Esta acción no se puede deshacer.')) return
    startTransition(async () => {
      await deleteThread(threadId, courseId)
      router.push(`/dashboard/teacher/courses/${courseId}/forum`)
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs px-3 py-1.5 rounded-lg border border-black/10 text-[var(--ag-text-muted)] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all disabled:opacity-50"
    >
      {isPending ? 'Eliminando...' : 'Eliminar tema'}
    </button>
  )
}
