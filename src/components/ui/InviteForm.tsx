'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { inviteUser, type ActionState } from '@/app/actions/admin'
import SubmitButton from '@/components/ui/SubmitButton'
import type { Institute } from '@/lib/types'

interface Props {
  institutes: Institute[]
}

export default function InviteForm({ institutes }: Props) {
  const initialState: ActionState = {}
  const [state, formAction] = useActionState(inviteUser, initialState)

  useEffect(() => {
    if (state.success) {
      toast.success('¡Invitación enviada! El usuario recibirá un correo en breve.')
    } else if (state.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#050F1F] mb-1.5">
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <input
            name="full_name"
            placeholder="Ej: María González"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition"
          />
          {state.fieldErrors?.full_name && (
            <p className="mt-1 text-xs text-red-500">{state.fieldErrors.full_name[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#050F1F] mb-1.5">
            Rol <span className="text-red-500">*</span>
          </label>
          <select
            name="role"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition bg-white"
          >
            <option value="">Seleccioná un rol</option>
            <option value="profesor">Profesor</option>
            <option value="alumno">Alumno</option>
          </select>
          {state.fieldErrors?.role && (
            <p className="mt-1 text-xs text-red-500">{state.fieldErrors.role[0]}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#050F1F] mb-1.5">
          Correo electrónico <span className="text-red-500">*</span>
        </label>
        <input
          name="email"
          type="email"
          placeholder="usuario@instituto.edu"
          required
          className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition"
        />
        {state.fieldErrors?.email && (
          <p className="mt-1 text-xs text-red-500">{state.fieldErrors.email[0]}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-[#050F1F] mb-1.5">
          Instituto <span className="text-red-500">*</span>
        </label>
        <select
          name="institute_id"
          required
          className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition bg-white"
        >
          <option value="">Seleccioná un instituto</option>
          {institutes.map((inst) => (
            <option key={inst.id} value={inst.id}>
              {inst.name}
            </option>
          ))}
        </select>
        {state.fieldErrors?.institute_id && (
          <p className="mt-1 text-xs text-red-500">{state.fieldErrors.institute_id[0]}</p>
        )}
      </div>

      <SubmitButton label="✉️ Enviar invitación" loadingLabel="Enviando..." />
    </form>
  )
}
