'use client'

import { useState, useTransition } from 'react'
import { submitQuizAttempt } from '@/app/actions/quizzes'
import type { Quiz, QuizAttempt } from '@/lib/types'
import Link from 'next/link'

interface Props {
  quiz: Quiz
  courseId: string
  previousAttempt: QuizAttempt | null
}

type Phase = 'intro' | 'playing' | 'result'

export default function QuizPlayer({ quiz, courseId, previousAttempt }: Props) {
  const questions = quiz.content
  const [phase, setPhase] = useState<Phase>(previousAttempt ? 'result' : 'intro')
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null))
  const [score, setScore] = useState<number>(previousAttempt?.score ?? 0)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const select = (qIdx: number, oIdx: number) =>
    setAnswers((a) => a.map((v, i) => i === qIdx ? oIdx : v))

  const allAnswered = answers.every((a) => a !== null)

  const handleSubmit = () => {
    if (!allAnswered) { setError('Respondé todas las preguntas antes de enviar.'); return }
    setError(null)

    startTransition(async () => {
      const result = await submitQuizAttempt(quiz.id, answers as number[])
      if (!result.success) { setError(result.error ?? 'Error al enviar'); return }
      setScore(result.score ?? 0)
      setPhase('result')
    })
  }

  // ── INTRO ────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-3xl mx-auto mb-4">
          🧠
        </div>
        <h2 className="text-xl font-bold text-[var(--ag-text)] mb-2">{quiz.title}</h2>
        <p className="text-[var(--ag-text-muted)] mb-6">
          {questions.length} pregunta{questions.length !== 1 ? 's' : ''} de opción múltiple.<br />
          Respondé todas para obtener tu puntaje.
        </p>
        <button
          onClick={() => setPhase('playing')}
          className="px-8 py-3 rounded-xl bg-[var(--ag-navy)] text-white font-semibold hover:opacity-90 transition shadow-lg "
        >
          Comenzar quiz →
        </button>
      </div>
    )
  }

  // ── RESULT ───────────────────────────────────────────────────────
  if (phase === 'result') {
    const correct = previousAttempt
      ? (previousAttempt.answers ?? []).filter((a, i) => a === questions[i]?.correct).length
      : answers.filter((a, i) => a === questions[i]?.correct).length

    const resultAnswers = previousAttempt ? previousAttempt.answers : (answers as number[])

    return (
      <div className="space-y-6">
        {/* Score card */}
        <div className={`rounded-2xl p-8 text-center ${
          score >= 80 ? 'bg-green-50 border border-green-200' :
          score >= 60 ? 'bg-amber-50 border border-amber-200' :
          'bg-red-50 border border-red-200'
        }`}>
          <p className="text-6xl font-black mb-2" style={{ color: score >= 80 ? '#059669' : score >= 60 ? '#D97706' : '#DC2626' }}>
            {score}%
          </p>
          <p className="text-lg font-semibold text-[var(--ag-text)] mb-1">
            {correct} de {questions.length} correctas
          </p>
          <p className="text-sm text-[var(--ag-text-muted)]">
            {score >= 80 ? '🎉 ¡Excelente resultado!' : score >= 60 ? '👍 Buen intento' : '📚 Seguí practicando'}
          </p>
        </div>

        {/* Answer review */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-[var(--ag-text)]">Revisión de respuestas</h2>
          {questions.map((q, qIdx) => {
            const selected = resultAnswers[qIdx]
            const isCorrect = selected === q.correct
            return (
              <div
                key={q.id}
                className={`bg-white rounded-xl border p-4 ${isCorrect ? 'border-green-200' : 'border-red-200'}`}
              >
                <div className="flex items-start gap-2 mb-3">
                  <span className="text-sm">{isCorrect ? '✅' : '❌'}</span>
                  <p className="text-sm font-semibold text-[var(--ag-text)]">{q.question}</p>
                </div>
                <div className="space-y-1.5 ml-6">
                  {q.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className={`text-sm px-3 py-1.5 rounded-lg ${
                        oIdx === q.correct
                          ? 'bg-green-100 text-green-700 font-medium'
                          : oIdx === selected && selected !== q.correct
                          ? 'bg-red-100 text-red-700'
                          : 'text-[var(--ag-text-muted)]'
                      }`}
                    >
                      {oIdx === q.correct && '✓ '}
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { setAnswers(Array(questions.length).fill(null)); setPhase('playing') }}
            className="flex-1 py-3 rounded-xl border border-black/10 text-sm font-semibold text-[var(--ag-text)]/70 hover:bg-black/5 transition"
          >
            Volver a intentar
          </button>
          <Link
            href={`/dashboard/student/courses/${courseId}`}
            className="flex-1 py-3 rounded-xl bg-[var(--ag-navy)] text-white text-sm font-semibold hover:opacity-90 transition text-center"
          >
            Volver al curso
          </Link>
        </div>
      </div>
    )
  }

  // ── PLAYING ──────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {questions.map((q, qIdx) => (
        <div key={q.id} className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
          <div className="flex items-start gap-3 mb-4">
            <span className="w-7 h-7 rounded-lg bg-[rgba(30,58,95,0.08)] text-[var(--ag-navy)] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {qIdx + 1}
            </span>
            <p className="font-semibold text-[var(--ag-text)] text-sm leading-relaxed">{q.question}</p>
          </div>

          <div className="space-y-2 ml-10">
            {q.options.map((opt, oIdx) => {
              const selected = answers[qIdx] === oIdx
              return (
                <button
                  key={oIdx}
                  onClick={() => select(qIdx, oIdx)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm border-2 transition-all font-medium ${
                    selected
                      ? 'border-[var(--ag-navy)] bg-[rgba(30,58,95,0.08)] text-[var(--ag-navy)]'
                      : 'border-black/5 hover:border-[var(--ag-border-light)] text-[var(--ag-text)]/70 hover:text-[var(--ag-text)]'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      selected ? 'border-[var(--ag-navy)] bg-[var(--ag-navy)]' : 'border-black/20'
                    }`}>
                      {selected && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                    </span>
                    {opt}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Progress indicator */}
      <div className="text-center text-xs text-[var(--ag-text-muted)]">
        {answers.filter((a) => a !== null).length} de {questions.length} respondidas
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setPhase('intro')}
          className="px-4 py-3 rounded-xl border border-black/10 text-sm font-semibold text-[var(--ag-text)]/70 hover:bg-black/5 transition"
        >
          ← Volver
        </button>
        <button
          onClick={handleSubmit}
          disabled={isPending || !allAnswered}
          className="flex-1 py-3 rounded-xl bg-[var(--ag-navy)] text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 shadow-lg "
        >
          {isPending ? 'Enviando...' : 'Enviar respuestas'}
        </button>
      </div>
    </div>
  )
}
