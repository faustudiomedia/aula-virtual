'use client'

import { useState, useOptimistic, useTransition } from 'react'
import { updateMaterialProgress } from '@/app/actions/courses'
import type { Material } from '@/lib/types'
import ProgressBar from '@/components/ui/ProgressBar'

interface Props {
  materials: Material[]
  enrollmentId: string
}

const FILE_TYPE_META: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  pdf:   { icon: '📄', label: 'PDF',    color: '#DC2626', bg: '#FEF2F2' },
  video: { icon: '🎥', label: 'Video',  color: '#7C3AED', bg: '#F5F3FF' },
  image: { icon: '🖼️', label: 'Imagen', color: '#059669', bg: '#ECFDF5' },
  link:  { icon: '🔗', label: 'Enlace', color: 'var(--ag-navy)', bg: 'rgba(30,58,95,0.06)' },
}

export default function MaterialProgress({ materials, enrollmentId }: Props) {
  const total = materials.length
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const initialSeen = new Set<string>()
  const [seen, setOptimisticSeen] = useOptimistic(
    initialSeen,
    (prev: Set<string>, materialId: string) => {
      const next = new Set(prev)
      if (next.has(materialId)) next.delete(materialId)
      else next.add(materialId)
      return next
    }
  )

  const [, startTransition] = useTransition()

  const toggle = (materialId: string) => {
    startTransition(async () => {
      setOptimisticSeen(materialId)
      const next = new Set(seen)
      if (next.has(materialId)) next.delete(materialId)
      else next.add(materialId)
      await updateMaterialProgress(enrollmentId, next.size, total)
    })
  }

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const progress = total > 0 ? Math.round((seen.size / total) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Progress summary */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-[var(--ag-text)]">
            {seen.size} de {total} materiales completados
          </p>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
            progress >= 100
              ? 'bg-green-100 text-green-700'
              : progress > 0
              ? 'bg-blue-100 text-blue-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {progress >= 100 ? '¡Completado!' : progress > 0 ? 'En progreso' : 'Sin iniciar'}
          </span>
        </div>
        <ProgressBar value={progress} />
      </div>

      {/* Material list */}
      <div className="space-y-2">
        {materials.map((material, idx) => {
          const isDone = seen.has(material.id)
          const isOpen = expanded.has(material.id)
          const meta = FILE_TYPE_META[material.file_type ?? 'link'] ?? FILE_TYPE_META.link

          return (
            <div
              key={material.id}
              className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${
                isDone
                  ? 'border-green-200 bg-green-50/30'
                  : 'border-black/5 hover:border-[var(--ag-border-light)] hover:shadow-sm'
              }`}
            >
              {/* Main row — clickeable */}
              <button
                type="button"
                onClick={() => toggleExpand(material.id)}
                className="w-full text-left p-4 flex items-center gap-4 cursor-pointer"
              >
                {/* Order index */}
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isDone
                    ? 'bg-green-100 text-green-700'
                    : 'bg-[rgba(30,58,95,0.06)] border border-[var(--ag-border-light)] text-[var(--ag-navy)]'
                }`}>
                  {isDone ? '✓' : idx + 1}
                </span>

                {/* Title + type badge */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium text-sm ${isDone ? 'text-[var(--ag-text-muted)] line-through' : 'text-[var(--ag-text)]'}`}>
                      {material.title}
                    </p>
                    {material.file_type && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                        style={{ color: meta.color, background: meta.bg }}
                      >
                        {meta.icon} {meta.label}
                      </span>
                    )}
                  </div>
                  {!isOpen && material.description && (
                    <p className="text-xs text-[var(--ag-text-muted)] mt-0.5 truncate">{material.description}</p>
                  )}
                </div>

                {/* Expand indicator */}
                <span className={`text-[var(--ag-text)]/30 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                  ▼
                </span>

                {/* Checkbox */}
                <span
                  role="checkbox"
                  aria-checked={isDone}
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); toggle(material.id) }}
                  onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.stopPropagation(); toggle(material.id) } }}
                  className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-all flex items-center justify-center cursor-pointer ${
                    isDone
                      ? 'bg-green-500 border-green-500'
                      : 'border-black/20 hover:border-[var(--ag-navy)]'
                  }`}
                >
                  {isDone && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
              </button>

              {/* Expanded content */}
              {isOpen && (
                <div className="px-4 pb-4 pt-0 border-t border-black/5">
                  {material.description && (
                    <p className="text-sm text-[var(--ag-text)]/70 mt-3 mb-3 leading-relaxed">
                      {material.description}
                    </p>
                  )}

                  {material.file_url ? (
                    <a
                      href={material.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 shadow-lg"
                      style={{ background: meta.color, boxShadow: `0 4px 14px ${meta.color}33` }}
                    >
                      <span className="text-base">{meta.icon}</span>
                      Abrir {meta.label}
                      <span className="text-xs opacity-80">↗</span>
                    </a>
                  ) : (
                    <p className="text-xs text-[var(--ag-text-muted)] italic">
                      Este material no tiene archivo adjunto todavía.
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
