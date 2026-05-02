'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteQuiz, toggleQuizPublished } from '@/app/actions/quizzes'

interface DeleteQuizButtonProps {
  quizId: string
  quizTitle: string
}

export function DeleteQuizButton({ quizId, quizTitle }: DeleteQuizButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDelete = () => {
    if (!confirm(`¿Eliminar "${quizTitle}"?`)) return
    startTransition(async () => {
      await deleteQuiz(quizId)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition font-medium disabled:opacity-60"
    >
      {isPending ? '...' : 'Eliminar'}
    </button>
  )
}

interface ToggleQuizButtonProps {
  quizId: string
  isPublished: boolean
}

export function ToggleQuizButton({ quizId, isPublished }: ToggleQuizButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleToggle = () => {
    startTransition(async () => {
      await toggleQuizPublished(quizId, isPublished)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className="text-xs px-3 py-1.5 rounded-lg border border-black/10 hover:bg-black/5 transition text-[var(--ag-text)]/70 font-medium disabled:opacity-60"
    >
      {isPending ? '...' : isPublished ? 'Despublicar' : 'Publicar'}
    </button>
  )
}
