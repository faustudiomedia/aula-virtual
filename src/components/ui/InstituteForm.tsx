'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createInstitute, type ActionState } from '@/app/actions/courses'
import SubmitButton from '@/components/ui/SubmitButton'

export default function InstituteForm() {
  const initialState: ActionState = {}
  const [state, formAction] = useActionState(createInstitute, initialState)
  const router = useRouter()

  useEffect(() => {
    if (state.success) {
      toast.success('¡Instituto creado exitosamente!')
      router.push('/dashboard/admin')
      router.refresh()
    } else if (state.error) {
      toast.error(state.error)
    }
  }, [state, router])

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#050F1F] mb-1.5">Nombre <span className="text-red-500">*</span></label>
          <input name="name" placeholder="Ej: Instituto San Martín"
            className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition" />
          {state.fieldErrors?.name && <p className="mt-1 text-sm text-red-500">{state.fieldErrors.name[0]}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-[#050F1F] mb-1.5">Slug <span className="text-red-500">*</span></label>
          <input name="slug" placeholder="san-martin" pattern="[a-z0-9\-]+"
            className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition" />
          {state.fieldErrors?.slug && <p className="mt-1 text-sm text-red-500">{state.fieldErrors.slug[0]}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#050F1F] mb-1.5">Dominio personalizado</label>
        <input name="domain" type="text" placeholder="Ej: sanmartin.edu.ar"
          className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition" />
        <p className="text-xs text-[#050F1F]/40 mt-1">Opcional. Se usará para branding multi-dominio.</p>
        {state.fieldErrors?.domain && <p className="mt-1 text-sm text-red-500">{state.fieldErrors.domain[0]}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#050F1F] mb-1.5">Color primario</label>
          <div className="flex items-center gap-2">
            <input type="color" name="primary_color" defaultValue="#1A56DB"
              className="w-10 h-10 rounded-lg border border-black/10 cursor-pointer p-0.5" />
            <input type="text" defaultValue="#1A56DB" readOnly
              className="flex-1 px-3 py-2.5 rounded-xl border border-black/10 text-sm bg-[#F0F9FF] text-[#050F1F]/60 font-mono" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#050F1F] mb-1.5">Color secundario</label>
          <div className="flex items-center gap-2">
            <input type="color" name="secondary_color" defaultValue="#38BDF8"
              className="w-10 h-10 rounded-lg border border-black/10 cursor-pointer p-0.5" />
            <input type="text" defaultValue="#38BDF8" readOnly
              className="flex-1 px-3 py-2.5 rounded-xl border border-black/10 text-sm bg-[#F0F9FF] text-[#050F1F]/60 font-mono" />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <SubmitButton label="Crear instituto" loadingLabel="Creando..." />
        <a href="/dashboard/admin"
          className="flex-1 flex items-center justify-center py-2.5 rounded-xl border border-black/10 text-[#050F1F]/70 font-semibold text-sm text-center hover:bg-black/5 transition">
          Cancelar
        </a>
      </div>
    </form>
  )
}
