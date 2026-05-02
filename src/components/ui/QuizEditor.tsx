'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createQuiz } from '@/app/actions/quizzes'
import type { QuizQuestion } from '@/lib/types'
import FormError from '@/components/ui/FormError'

interface Props {
  courseId: string
}

const emptyQuestion = (): QuizQuestion => ({
  id: crypto.randomUUID(),
  question: '',
  options: ['', ''],
  correct: 0,
})

export default function QuizEditor({ courseId }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<QuizQuestion[]>([emptyQuestion()])
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [success, setSuccess] = useState(false)

  // ── Mutaciones de preguntas ──────────────────────────────────────
  const addQuestion = () => setQuestions((q) => [...q, emptyQuestion()])

  const removeQuestion = (idx: number) =>
    setQuestions((q) => q.filter((_, i) => i !== idx))

  const updateQuestion = (idx: number, field: 'question', value: string) =>
    setQuestions((q) => q.map((item, i) => i === idx ? { ...item, [field]: value } : item))

  const updateOption = (qIdx: number, oIdx: number, value: string) =>
    setQuestions((q) => q.map((item, i) => i === qIdx
      ? { ...item, options: item.options.map((o, j) => j === oIdx ? value : o) }
      : item
    ))

  const addOption = (qIdx: number) =>
    setQuestions((q) => q.map((item, i) => i === qIdx && item.options.length < 6
      ? { ...item, options: [...item.options, ''] }
      : item
    ))

  const removeOption = (qIdx: number, oIdx: number) =>
    setQuestions((q) => q.map((item, i) => {
      if (i !== qIdx || item.options.length <= 2) return item
      const newOptions = item.options.filter((_, j) => j !== oIdx)
      const newCorrect = item.correct >= oIdx && item.correct > 0 ? item.correct - 1 : item.correct
      return { ...item, options: newOptions, correct: Math.min(newCorrect, newOptions.length - 1) }
    }))

  const setCorrect = (qIdx: number, oIdx: number) =>
    setQuestions((q) => q.map((item, i) => i === qIdx ? { ...item, correct: oIdx } : item))

  // ── Submit ───────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) { setError('El título es obligatorio'); return }
    for (const [i, q] of questions.entries()) {
      if (!q.question.trim()) { setError(`La pregunta ${i + 1} está vacía`); return }
      for (const [j, o] of q.options.entries()) {
        if (!o.trim()) { setError(`La opción ${j + 1} de la pregunta ${i + 1} está vacía`); return }
      }
    }

    setIsPending(true)
    const formData = new FormData()
    formData.set('title', title)

    const result = await createQuiz(courseId, questions, { success: false }, formData)
    setIsPending(false)

    if (!result.success) { setError(result.error ?? 'Error al crear el quiz'); return }
    setSuccess(true)
    setTimeout(() => router.push(`/dashboard/teacher/courses/${courseId}/quizzes`), 1200)
  }

  if (success) {
    return (
      <div className="bg-green-100/50 border border-green-300/50 rounded-2xl p-8 text-center">
        <p className="text-4xl mb-3">🎉</p>
        <p className="text-green-700 font-semibold">¡Quiz creado exitosamente!</p>
        <p className="text-green-600 text-sm mt-1">Redirigiendo...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Quiz title */}
      <div>
        <label className="block text-sm font-semibold text-[var(--ag-text)] mb-2">Título del quiz</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: Evaluación unidad 1"
          className="w-full px-4 py-3 rounded-xl border border-[var(--ag-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 focus:border-[var(--ag-navy)] transition"
        />
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, qIdx) => (
          <div key={q.id} className="bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[var(--ag-navy)] bg-[rgba(30,58,95,0.08)] px-2.5 py-1 rounded-full">
                Pregunta {qIdx + 1}
              </span>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(qIdx)}
                  className="text-xs text-red-500 hover:text-red-700 transition"
                >
                  ✕ Eliminar
                </button>
              )}
            </div>

            {/* Question text */}
            <textarea
              value={q.question}
              onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
              placeholder="Escribí la pregunta aquí..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-[var(--ag-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 focus:border-[var(--ag-navy)] transition mb-4 resize-none"
            />

            {/* Options */}
            <p className="text-xs font-semibold text-[var(--ag-text-muted)] mb-2">Opciones — marcá la correcta</p>
            <div className="space-y-2">
              {q.options.map((option, oIdx) => (
                <div key={oIdx} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCorrect(qIdx, oIdx)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                      q.correct === oIdx
                        ? 'bg-green-500 border-green-500'
                        : 'border-black/20 hover:border-green-400'
                    }`}
                    aria-label={`Marcar opción ${oIdx + 1} como correcta`}
                  >
                    {q.correct === oIdx && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--ag-surface)] block" />
                    )}
                  </button>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                    placeholder={`Opción ${oIdx + 1}`}
                    className="flex-1 px-3 py-2 rounded-lg border border-[var(--ag-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ag-border-light)] focus:border-[var(--ag-navy)] transition"
                  />
                  {q.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(qIdx, oIdx)}
                      className="text-[var(--ag-text)]/30 hover:text-red-500 transition text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {q.options.length < 6 && (
              <button
                type="button"
                onClick={() => addOption(qIdx)}
                className="mt-3 text-xs text-[var(--ag-navy)] hover:underline font-medium"
              >
                + Agregar opción
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addQuestion}
        className="w-full py-3 rounded-xl border-2 border-dashed border-[var(--ag-border-light)] text-[var(--ag-navy)] text-sm font-medium hover:bg-[rgba(30,58,95,0.08)] transition"
      >
        + Agregar pregunta
      </button>

      <FormError message={error} />

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-3 rounded-xl border border-[var(--ag-border)] text-sm font-semibold text-[var(--ag-text)]/70 hover:bg-[var(--ag-surface-alt)] transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-3 rounded-xl bg-[var(--ag-navy)] text-white text-sm font-semibold hover:opacity-90 transi
