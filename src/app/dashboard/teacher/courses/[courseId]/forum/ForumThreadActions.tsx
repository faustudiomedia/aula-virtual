'use client'

import { useTransition } from 'react'
import { deleteThread, togglePinThread } from '@/app/actions/forum'

interface Props {
  threadId: string
  courseId: string
  pinned: boolean
}

export function ForumThreadActions({ threadId, courseId, pinned }: Props) {
  const [isPinPending, startPin] = useTransition()
  const [isDelPending, startDel] = useTransition()

  function handlePin() {
    startPin(() => togglePinThread(threadId, pinned, courseId))
  }

  function handleDelete() {
    if (!confirm('¿Eliminar este tema del foro? Esta acción no se puede deshacer.')) return
    startDel(() => deleteThread(threadId, courseId))
  }

  return (
    <div className="flex gap-2 flex-shrink-0">
      <button
        onClick={handlePin}
        disabled={isPinPending}
        className="text-xs px-3 py-1.5 rounded-lg border border-black/10 text-[var(--ag-text-muted)] hover:bg-amber-50 hover:text-amber-600 hover:border-amber-300/50 transition-all disabled:opacity-50"
      >
        {isPinPending ? '...' : pinned ? 'Desfijar' : 'Fijar'}
      </button>
      <button
        onClick={handleDelete}
        disabled={isDelPending}
        className="text-xs px-3 py-1.5 rounded-lg border border-black/10 text-[var(--ag-text-muted)] hover:bg-red-50 hover:text-red-600 hover:border-red-300/50 transition-all disabled:opacity-50"
      >
        {isDelPending ? '...' : 'Eliminar'}
      </button>
