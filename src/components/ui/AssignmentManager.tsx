'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Assignment, Submission } from '@/lib/types'
import { createAssignment, submitAssignment, gradeSubmission } from '@/app/actions/campus'

interface Props {
  assignments: Assignment[]
  courseId: string
  courseTitle: string
  isTeacher: boolean
  submissionsByAssignment?: Record<string, Submission[]> // Teacher only
  studentSubmissions?: Record<string, Submission> // Student only
}

export default function AssignmentManager({
  assignments,
  courseId,
  courseTitle,
  isTeacher,
  submissionsByAssignment = {},
  studentSubmissions = {}
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Teacher Create form state
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [maxScore, setMaxScore] = useState(100)

  // Student Submit form state
  const [submitAssignmentId, setSubmitAssignmentId] = useState<string | null>(null)
  const [fileUrl, setFileUrl] = useState('')
  const [comment, setComment] = useState('')

  // Teacher Grade form state
  const [gradeSubmissionId, setGradeSubmissionId] = useState<string | null>(null)
  const [score, setScore] = useState<number | ''>('')
  const [feedback, setFeedback] = useState('')
  
  // View toggle
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null)

  function handleCreate() {
    if (!title.trim()) { setError('El título es requerido'); return }
    setError(null)
    startTransition(async () => {
      const res = await createAssignment(courseId, title, description, dueDate || undefined, maxScore)
      if (!res.success) { setError(res.error ?? 'Error'); return }
      setTitle(''); setDescription(''); setDueDate(''); setMaxScore(100); setShowForm(false); router.refresh()
    })
  }

  function handleSubmit() {
    if (!submitAssignmentId) return
    setError(null)
    startTransition(async () => {
      const res = await submitAssignment(submitAssignmentId, comment, fileUrl || undefined)
      if (!res.success) { setError(res.error ?? 'Error'); return }
      setSubmitAssignmentId(null); setFileUrl(''); setComment(''); router.refresh()
    })
  }

  function handleGrade() {
    if (!gradeSubmissionId || score === '') return
    setError(null)
    startTransition(async () => {
      const res = await gradeSubmission(gradeSubmissionId, Number(score), feedback)
      if (!res.success) { setError(res.error ?? 'Error'); return }
      setGradeSubmissionId(null); setScore(''); setFeedback(''); router.refresh()
    })
  }

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' }) : 'Sin fecha límite'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#050F1F]">📦 Trabajos Prácticos</h2>
        {isTeacher && (
          <button
            onClick={() => { setShowForm(!showForm); setError(null) }}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#D97706] text-white hover:opacity-90 transition shadow-lg shadow-[#D97706]/20"
          >
            {showForm ? 'Cancelar' : '+ Nueva Tarea'}
          </button>
        )}
      </div>

      {/* Form Teacher Create */}
      {isTeacher && showForm && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 mb-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-[#050F1F]">Título *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: TP 1 - Introducción"
                className="w-full px-3 py-2 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-300 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[#050F1F]">Fecha límite (opcional)</label>
              <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-300 outline-none text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-[#050F1F]">Descripción (opcional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Instrucciones para el trabajo..." rows={3}
              className="w-full px-3 py-2 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-300 outline-none resize-none text-sm" />
          </div>
          <div>
             <label className="block text-sm font-medium mb-1 text-[#050F1F]">Puntaje Máximo</label>
             <input type="number" value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value) || 100)} min="1"
                className="w-32 px-3 py-2 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-300 outline-none text-sm" />
          </div>
          <button onClick={handleCreate} disabled={isPending}
            className="px-5 py-2 rounded-lg bg-[#D97706] text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-60">
            {isPending ? 'Creando...' : 'Crear Trabajo Práctico'}
          </button>
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#BAE6FD] p-10 text-center">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-[#050F1F]/50">No hay trabajos prácticos en este curso.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map(assign => {
            const isExpanded = expandedAssignmentId === assign.id
            const subs = submissionsByAssignment[assign.id] || []
            const mySub = studentSubmissions[assign.id] // para alumno
            
            return (
              <div key={assign.id} className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden">
                <div 
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-black/5 transition"
                  onClick={() => setExpandedAssignmentId(isExpanded ? null : assign.id)}
                >
                  <div className="flex items-start gap-4">
                     <div className="w-10 h-10 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] flex flex-col items-center justify-center flex-shrink-0 text-[#D97706]">
                        <span className="text-sm font-bold">{subs.length > 0 && isTeacher ? subs.length : (mySub ? '✓' : '—')}</span>
                        <span className="text-[10px] uppercase">{isTeacher ? 'Entregas' : 'Estado'}</span>
                     </div>
                     <div>
                       <h3 className="text-base font-bold text-[#050F1F]">{assign.title}</h3>
                       <p className="text-sm text-[#050F1F]/50 mt-1">
                          Vencimiento: <span className={assign.due_date && new Date(assign.due_date) < new Date() ? "text-red-500 font-medium" : ""}>{formatDate(assign.due_date)}</span> · Puntuación máx: {assign.max_score}
                       </p>
                     </div>
                  </div>
                  <span className={`text-[#050F1F]/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                </div>

                {isExpanded && (
                  <div className="border-t border-black/5 p-5 bg-[#F8FAFC]">
                    <p className="text-sm text-[#050F1F]/80 whitespace-pre-wrap mb-4">{assign.description || 'Sin descripción adicional.'}</p>
                    
                    {/* --- STUDENT VIEW --- */}
                    {!isTeacher && (
                      <div className="bg-white rounded-lg border border-black/10 p-4">
                        <h4 className="font-semibold text-sm mb-3">Mi Entrega</h4>
                        {mySub ? (
                          <div className="space-y-3 text-sm">
                            <p><span className="text-[#050F1F]/50">Fecha de entrega:</span> {formatDate(mySub.submitted_at)}</p>
                            {mySub.file_url && (
                              <p><span className="text-[#050F1F]/50">Archivo adjunto:</span> <a href={mySub.file_url} target="_blank" rel="noopener noreferrer" className="text-[#1A56DB] hover:underline">Ver archivo ↗</a></p>
                            )}
                            {mySub.comment && <p><span className="text-[#050F1F]/50">Mi comentario:</span> <span className="p-2 bg-black/5 rounded inline-block w-full mt-1 whitespace-pre-wrap">{mySub.comment}</span></p>}
                            <div className={`mt-3 p-3 rounded border ${mySub.score !== null ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                              <p className="font-semibold">
                                Calificación: {mySub.score !== null ? <span className="text-green-700 text-lg">{mySub.score} / {assign.max_score}</span> : <span className="text-gray-500">Pendiente de corrección</span>}
                              </p>
                              {mySub.feedback && <p className="mt-2 text-sm text-[#050F1F]/70"><strong>Feedback del profesor:</strong> {mySub.feedback}</p>}
                            </div>
                            {mySub.score === null && (
                              <div className="mt-3 text-right">
                                <button onClick={() => {setSubmitAssignmentId(assign.id); setFileUrl(mySub.file_url || ''); setComment(mySub.comment || '')}} className="text-xs text-[#1A56DB] hover:underline">Rehacer entrega</button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            {submitAssignmentId === assign.id ? (
                              <div className="space-y-3">
                                {error && <p className="text-xs text-red-600 p-1">{error}</p>}
                                <input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="URL del archivo (Google Drive, repos, etc.)" className="w-full px-3 py-2 text-sm rounded border outline-none focus:border-[#1A56DB]" />
                                <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Comentarios adicionales para el profesor..." className="w-full px-3 py-2 text-sm rounded border outline-none resize-none focus:border-[#1A56DB]" />
                                <div className="flex gap-2">
                                  <button onClick={handleSubmit} disabled={isPending} className="px-4 py-2 bg-[#1A56DB] text-white text-sm rounded font-medium disabled:opacity-60">Enviar Trabajo</button>
                                  <button onClick={() => setSubmitAssignmentId(null)} className="px-4 py-2 bg-black/5 text-[#050F1F] text-sm rounded font-medium">Cancelar</button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-[#050F1F]/50 flex items-center justify-between">No entregaste este trabajo. 
                                <button onClick={() => setSubmitAssignmentId(assign.id)} className="px-4 py-2 rounded bg-[#059669] text-white font-medium hover:opacity-90">Realizar Entrega</button>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* --- TEACHER VIEW --- */}
                    {isTeacher && (
                      <div className="mt-4 border-t border-black/10 pt-4">
                        <h4 className="font-semibold text-sm mb-3">Entregas de los alumnos ({subs.length})</h4>
                        {subs.length === 0 ? (
                          <p className="text-sm text-[#050F1F]/50 italic">Nadie entregó este TP todavía.</p>
                        ) : (
                          <div className="space-y-3">
                            {subs.map(sub => (
                              <div key={sub.id} className="bg-white p-3 rounded-lg border border-black/10 shadow-sm text-sm">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="font-semibold">{sub.student?.full_name || sub.student?.email}</p>
                                    <p className="text-xs text-[#050F1F]/50">Entregado: {formatDate(sub.submitted_at)}</p>
                                  </div>
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${sub.score !== null ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {sub.score !== null ? `${sub.score} / ${assign.max_score}` : 'Pendiente'}
                                  </span>
                                </div>
                                <div className="text-[#050F1F]/80 text-xs my-2 space-y-1">
                                  {sub.file_url && <p>📦 Archivo: <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="text-[#1A56DB] underline">Abrir enlace</a></p>}
                                  {sub.comment && <p className="italic bg-black/5 p-1.5 rounded">"{sub.comment}"</p>}
                                </div>

                                {/* Calificar */}
                                {gradeSubmissionId === sub.id ? (
                                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                                    <div className="flex gap-2">
                                      <input type="number" placeholder="Nota" value={score} onChange={(e) => setScore(e.target.value ? Number(e.target.value) : '')} max={assign.max_score} min={0} className="w-20 px-2 py-1 text-sm border rounded focus:ring shadow-sm" />
                                      <input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Feedback / Devolución..." className="flex-1 px-2 py-1 text-sm border rounded focus:ring shadow-sm" />
                                    </div>
                                    <div className="flex gap-2 mt-2 justify-end">
                                      <button onClick={() => setGradeSubmissionId(null)} className="px-3 py-1 bg-black/5 text-xs rounded hover:bg-black/10">Cancelar</button>
                                      <button onClick={handleGrade} disabled={isPending} className="px-3 py-1 bg-[#1A56DB] text-white text-xs rounded font-medium disabled:opacity-60">Guardar Nota</button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-3 flex justify-between items-center bg-gray-50 p-2 rounded text-xs text-[#050F1F]/60">
                                    <p>{sub.feedback ? `Feedback: ${sub.feedback}` : 'Sin feedback.'}</p>
                                    <button onClick={() => {setGradeSubmissionId(sub.id); setScore(sub.score ?? ''); setFeedback(sub.feedback || '')}} className="text-[#1A56DB] hover:underline font-medium">
                                      {sub.score !== null ? 'Editar Nota' : 'Calificar'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
