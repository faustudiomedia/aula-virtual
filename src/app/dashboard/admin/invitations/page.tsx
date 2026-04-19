import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Institute } from '@/lib/types'
import InviteForm from '@/components/ui/InviteForm'

export default async function InvitationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: institutes } = await supabase
    .from('institutes')
    .select('id, name')
    .eq('active', true)
    .order('name')

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#050F1F]">Invitar usuarios</h1>
        <p className="text-[#050F1F]/50 mt-1">
          Enviá un correo de invitación para que la persona cree su cuenta con el rol asignado.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
        <InviteForm institutes={(institutes ?? []) as Institute[]} />
      </div>

      {/* Info box */}
      <div className="mt-6 rounded-xl bg-[#EFF6FF] border border-[#BAE6FD] px-5 py-4">
        <p className="text-sm font-semibold text-[#1A56DB] mb-1">¿Cómo funciona?</p>
        <ul className="text-sm text-[#1A56DB]/70 space-y-1 list-disc list-inside">
          <li>El usuario recibirá un correo con un link seguro de activación.</li>
          <li>Al hacer clic, podrá crear su contraseña y accederá con el rol asignado.</li>
          <li>El link expira en 24 horas por seguridad.</li>
          <li>Requiere que <code className="bg-[#BAE6FD]/50 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> esté configurada en tu servidor.</li>
        </ul>
      </div>
    </div>
  )
}
