'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteMaterial, updateMaterial } from '@/app/actions/courses'
import type { Material } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import FormError from './FormError'
import { toast } from 'sonner'

export function DeleteMaterialButton({ materialId, materialTitle }: { materialId: string; materialTitle: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteMaterial(materialId)
      if (!result.success) { setError(result.error ?? 'Error al eliminar'); return }
      router.refresh()
    })
  }

  if (confirming) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
          <p className="text-4xl mb-3">🗑️</p>
          <h2 className="text-lg font-bold text-[#050F1F] mb-2">¿Eliminar material?</h2>
          <p className="text-sm text-[#050F1F]/60 mb-4">Se eliminará <strong>{materialTitle}</strong>. Esta acción no se puede deshacer.</p>
          <FormError message={error} />
          <div className="flex gap-3 mt-4">
            <button onClick={handleDelete} disabled={isPending}
              className="flex-1 py-2 rounded-xl bg-red-600 text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-60">
              {isPending ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
            <button onClick={() => setConfirming(false)}
              className="flex-1 py-2 rounded-xl border border-black/10 text-[#050F1F]/70 font-semibold text-sm hover:bg-black/5 transition">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)}
      className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium transition border border-red-200">
      🗑️
    </button>
  )
}

export function EditMaterialButton({ material }: { material: Material }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  
  const [fileType, setFileType] = useState(material.file_type ?? 'pdf')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const formData = new FormData(e.currentTarget)
    
    if (!(formData.get('title') as string)?.trim()) {
      setFieldErrors({ title: ['El título es requerido'] })
      return
    }

    setUploading(true)

    try {
      if (fileType !== 'link') {
        const file = formData.get('file_upload') as File
        if (file && file.size > 0) {
          const supabase = createClient()
          const ext = file.name.split('.').pop()
          const filename = `${material.course_id}/${crypto.randomUUID()}.${ext}`
          
          const { error: uploadError } = await supabase.storage
            .from('materials')
            .upload(filename, file, { cacheControl: '3600', upsert: false })
            
          if (uploadError) {
             setError('Error al subir el archivo: ' + uploadError.message)
             setUploading(false)
             return
          }
          
          const { data } = supabase.storage.from('materials').getPublicUrl(filename)
          formData.set('file_url', data.publicUrl)
        } else {
          // Keep existing URL if no new file is selected
          formData.set('file_url', material.file_url ?? '')
        }
      } else {
         if (!(formData.get('file_url') as string)?.trim()) {
            setFieldErrors({ file_url: ['La URL del enlace es requerida'] })
            setUploading(false)
            return
         }
      }

      startTransition(async () => {
        const result = await updateMaterial(material.id, {}, formData)
        if (!result.success) {
          setError(result.error ?? 'Error al actualizar')
          if (result.fieldErrors) setFieldErrors(result.fieldErrors)
        } else {
          toast.success('Material actualizado exitosamente')
          router.refresh()
          setEditing(false)
        }
      })
    } catch (err) {
      setError('Error inesperado al procesar el formulario')
    } finally {
      setUploading(false)
    }
  }

  const isWorking = uploading || isPending

  return (
    <>
      <button onClick={() => setEditing(true)}
        className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium transition border border-amber-200">
        ✏️
      </button>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-[#050F1F] mb-4">Editar material</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <FormError message={error} />
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input name="title" defaultValue={material.title} placeholder="Título *"
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] ${fieldErrors.title ? 'border-red-400' : 'border-black/10'}`} />
                  {fieldErrors.title && <p className="text-xs text-red-600 mt-1">{fieldErrors.title[0]}</p>}
                </div>
                <select name="file_type" value={fileType} onChange={(e) => setFileType(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] bg-white">
                  <option value="pdf">PDF</option>
                  <option value="video">Video</option>
                  <option value="link">Enlace (Externo)</option>
                  <option value="image">Imagen</option>
                </select>
              </div>
              
              <input name="description" defaultValue={material.description ?? ''} placeholder="Descripción (opcional)"
                className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]" />
              
              <div className="flex gap-3">
                <div className="flex-1">
                  {fileType === 'link' ? (
                    <input name="file_url" defaultValue={material.file_url ?? ''} placeholder="URL del enlace *"
                      className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] ${fieldErrors.file_url ? 'border-red-400' : 'border-black/10'}`} />
                  ) : (
                    <div>
                      {material.file_url && material.file_type !== 'link' && (
                        <p className="text-xs text-[#050F1F]/50 mb-1">Archivo actual: <a href={material.file_url} target="_blank" rel="noopener noreferrer" className="text-[#1A56DB] hover:underline">Ver</a> (Selecciona uno nuevo para reemplazar)</p>
                      )}
                      <input name="file_upload" type="file" accept={fileType === 'pdf' ? '.pdf' : fileType === 'image' ? 'image/*' : fileType === 'video' ? 'video/*' : '*/*'}
                        className="w-full px-3 py-1.5 rounded-lg border border-black/10 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#F0F9FF] file:text-[#1A56DB] hover:file:bg-[#E0F2FE]" />
                    </div>
                  )}
                  {fieldErrors.file_url && <p className="text-xs text-red-600 mt-1">{fieldErrors.file_url[0]}</p>}
                </div>
                
                <input name="order_index" type="number" min="0" defaultValue={material.order_index} placeholder="Orden"
                  className="w-24 px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]" />
              </div>
              
              <div className="flex gap-3 pt-2 mt-4">
                <button type="submit" disabled={isWorking}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-[#1A56DB] text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-60">
                  {uploading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Subiendo...
                    </>
                  ) : isPending ? (
                    'Guardando...'
                  ) : (
                    'Guardar'
                  )}
                </button>
                <button type="button" onClick={() => setEditing(false)} disabled={isWorking}
                  className="flex-1 py-2 rounded-xl border border-black/10 text-[#050F1F]/70 font-semibold text-sm hover:bg-black/5 transition disabled:opacity-60">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}