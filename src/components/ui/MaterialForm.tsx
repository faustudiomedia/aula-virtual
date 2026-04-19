'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { addMaterial, type ActionState } from '@/app/actions/courses'
import { createClient } from '@/lib/supabase/client'
import FormError from './FormError'

export default function MaterialForm({ courseId, orderIndex }: { courseId: string, orderIndex: number }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  
  const [fileType, setFileType] = useState('pdf')
  const [isPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    
    const formData = new FormData(e.currentTarget)
    
    // Basic validation
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
          const filename = `${courseId}/${crypto.randomUUID()}.${ext}`
          
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
        } else if (!formData.get('file_url')) {
          setError('Debes seleccionar un archivo')
          setUploading(false)
          return
        }
      } else {
         if (!(formData.get('file_url') as string)?.trim()) {
            setFieldErrors({ file_url: ['La URL del enlace es requerida'] })
            setUploading(false)
            return
         }
      }

      startTransition(async () => {
        const result = await addMaterial(courseId, {}, formData)
        if (!result.success) {
          setError(result.error ?? 'Error al agregar el material')
          if (result.fieldErrors) setFieldErrors(result.fieldErrors)
        } else {
          toast.success('¡Material agregado exitosamente!')
          formRef.current?.reset()
          setFileType('pdf')
          router.refresh()
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
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 mb-6">
      <h2 className="text-sm font-semibold text-[#050F1F] mb-4">Agregar material</h2>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
        <FormError message={error} />
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input name="title" placeholder="Título *" required
              className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] ${fieldErrors.title ? 'border-red-400' : 'border-black/10'}`} />
            {fieldErrors.title && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.title[0]}</p>
            )}
          </div>
          <div>
            <select name="file_type" required value={fileType} onChange={(e) => setFileType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] bg-white">
              <option value="pdf">PDF</option>
              <option value="video">Video</option>
              <option value="link">Enlace (Externo)</option>
              <option value="image">Imagen</option>
            </select>
          </div>
        </div>
        
        <input name="description" placeholder="Descripción (opcional)"
          className="w-full px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]" />
        
        <div className="flex gap-3">
          <div className="flex-1">
            {fileType === 'link' ? (
              <input name="file_url" placeholder="URL del enlace *"
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] ${fieldErrors.file_url ? 'border-red-400' : 'border-black/10'}`} />
            ) : (
              <input name="file_upload" type="file" accept={fileType === 'pdf' ? '.pdf' : fileType === 'image' ? 'image/*' : fileType === 'video' ? 'video/*' : '*/*'}
                className="w-full px-3 py-1.5 rounded-lg border border-black/10 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#F0F9FF] file:text-[#1A56DB] hover:file:bg-[#E0F2FE]" />
            )}
            {fieldErrors.file_url && (
              <p className="mt-1 text-xs text-red-500">{fieldErrors.file_url[0]}</p>
            )}
            {/* Hidden field to pass real URL to server action if file was uploaded */}
            {fileType !== 'link' && <input type="hidden" name="file_url" value="" />}
          </div>
          <input name="order_index" type="number" min="0" defaultValue={orderIndex} placeholder="Orden"
            className="w-24 px-3 py-2 rounded-lg border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8]" />
        </div>
        
        <button type="submit" disabled={isWorking}
          className="px-5 py-2 rounded-lg bg-[#1A56DB] text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2">
          {uploading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Subiendo...
            </>
          ) : isPending ? (
            'Agregando...'
          ) : (
            'Agregar'
          )}
        </button>
      </form>
    </div>
  )
}
